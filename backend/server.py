from fastapi import FastAPI, APIRouter, HTTPException, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

class StudentCreate(BaseModel):
    name: str
    branch: str
    year: str
    rollNumber: str

class Student(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    branch: str
    year: str
    rollNumber: str
    interests: List[str] = Field(default_factory=list)
    teams: List[str] = Field(default_factory=list)
    isLeader: bool = False
    createdAt: str

class InterestUpdate(BaseModel):
    studentId: str
    interests: List[str]

class Interest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    createdAt: str

class InterestCreate(BaseModel):
    name: str

class TeamCreate(BaseModel):
    name: str
    leaderId: str
    memberIds: List[str]
    interests: List[str]

class Team(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    leaderId: str
    leaderName: str
    memberIds: List[str]
    members: List[dict] = Field(default_factory=list)
    interests: List[str]
    status: str = "pending"
    createdAt: str

class JoinRequestCreate(BaseModel):
    teamId: str
    studentId: str

class JoinRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    teamId: str
    teamName: str
    studentId: str
    studentName: str
    status: str
    createdAt: str

class RequestAction(BaseModel):
    requestId: str
    action: str

class AdminLogin(BaseModel):
    password: str

@api_router.post("/auth/student", response_model=Student)
async def student_login(input: StudentCreate):
    import re
    roll_pattern = r'^\d{4}BT(CS|AI)\d{3}$'
    if not re.match(roll_pattern, input.rollNumber):
        raise HTTPException(status_code=400, detail="Invalid roll number format. Use: YYYYBTCS/AI###")
    
    existing = await db.students.find_one({"rollNumber": input.rollNumber}, {"_id": 0})
    
    if existing:
        if isinstance(existing.get('createdAt'), str):
            pass
        return Student(**existing)
    
    student = Student(
        id=str(uuid.uuid4()),
        name=input.name,
        branch=input.branch,
        year=input.year,
        rollNumber=input.rollNumber,
        interests=[],
        teams=[],
        isLeader=False,
        createdAt=datetime.now(timezone.utc).isoformat()
    )
    
    doc = student.model_dump()
    await db.students.insert_one(doc)
    return student

@api_router.get("/students/{student_id}", response_model=Student)
async def get_student(student_id: str):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return Student(**student)

@api_router.put("/students/{student_id}/interests")
async def update_interests(student_id: str, input: InterestUpdate):
    result = await db.students.update_one(
        {"id": student_id},
        {"$set": {"interests": input.interests}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Interests updated successfully"}

@api_router.get("/interests", response_model=List[Interest])
async def get_interests():
    interests = await db.interests.find({}, {"_id": 0}).to_list(1000)
    return [Interest(**i) for i in interests]

@api_router.post("/interests", response_model=Interest)
async def create_interest(input: InterestCreate):
    existing = await db.interests.find_one({"name": input.name}, {"_id": 0})
    if existing:
        return Interest(**existing)
    
    interest = Interest(
        id=str(uuid.uuid4()),
        name=input.name,
        createdAt=datetime.now(timezone.utc).isoformat()
    )
    await db.interests.insert_one(interest.model_dump())
    return interest

@api_router.delete("/interests/{interest_id}")
async def delete_interest(interest_id: str):
    result = await db.interests.delete_one({"id": interest_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Interest not found")
    return {"message": "Interest deleted successfully"}

@api_router.get("/students", response_model=List[Student])
async def get_students(interests: Optional[str] = None):
    query = {}
    if interests:
        interest_list = interests.split(",")
        query["interests"] = {"$in": interest_list}
    
    students = await db.students.find(query, {"_id": 0}).to_list(1000)
    return [Student(**s) for s in students]

@api_router.post("/teams", response_model=Team)
async def create_team(input: TeamCreate):
    leader = await db.students.find_one({"id": input.leaderId}, {"_id": 0})
    if not leader:
        raise HTTPException(status_code=404, detail="Leader not found")
    
    team = Team(
        id=str(uuid.uuid4()),
        name=input.name,
        leaderId=input.leaderId,
        leaderName=leader["name"],
        memberIds=input.memberIds,
        members=[],
        interests=input.interests,
        status="pending",
        createdAt=datetime.now(timezone.utc).isoformat()
    )
    
    await db.teams.insert_one(team.model_dump())
    
    await db.students.update_one(
        {"id": input.leaderId},
        {"$set": {"isLeader": True}, "$addToSet": {"teams": team.id}}
    )
    
    for member_id in input.memberIds:
        await db.students.update_one(
            {"id": member_id},
            {"$addToSet": {"teams": team.id}}
        )
    
    return team

@api_router.get("/teams", response_model=List[Team])
async def get_teams(search: Optional[str] = None):
    query = {}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    teams = await db.teams.find(query, {"_id": 0}).to_list(1000)
    result = []
    
    for team in teams:
        member_details = []
        for member_id in team.get("memberIds", []):
            member = await db.students.find_one({"id": member_id}, {"_id": 0, "name": 1, "id": 1})
            if member:
                member_details.append({"id": member["id"], "name": member["name"]})
        
        team["members"] = member_details
        result.append(Team(**team))
    
    return result

@api_router.get("/teams/student/{student_id}", response_model=List[Team])
async def get_student_teams(student_id: str):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    team_ids = student.get("teams", [])
    if not team_ids:
        return []
    
    teams = await db.teams.find({"id": {"$in": team_ids}, "status": "approved"}, {"_id": 0}).to_list(1000)
    result = []
    
    for team in teams:
        member_details = []
        for member_id in team.get("memberIds", []):
            member = await db.students.find_one({"id": member_id}, {"_id": 0, "name": 1, "id": 1})
            if member:
                member_details.append({"id": member["id"], "name": member["name"]})
        
        team["members"] = member_details
        result.append(Team(**team))
    
    return result

@api_router.post("/team-requests", response_model=JoinRequest)
async def create_join_request(input: JoinRequestCreate):
    team = await db.teams.find_one({"id": input.teamId}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    student = await db.students.find_one({"id": input.studentId}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    existing = await db.teamRequests.find_one(
        {"teamId": input.teamId, "studentId": input.studentId, "status": "pending"},
        {"_id": 0}
    )
    if existing:
        return JoinRequest(**existing)
    
    request = JoinRequest(
        id=str(uuid.uuid4()),
        teamId=input.teamId,
        teamName=team["name"],
        studentId=input.studentId,
        studentName=student["name"],
        status="pending",
        createdAt=datetime.now(timezone.utc).isoformat()
    )
    
    await db.teamRequests.insert_one(request.model_dump())
    return request

@api_router.get("/team-requests/team/{team_id}", response_model=List[JoinRequest])
async def get_team_requests(team_id: str):
    requests = await db.teamRequests.find(
        {"teamId": team_id, "status": "pending"},
        {"_id": 0}
    ).to_list(1000)
    return [JoinRequest(**r) for r in requests]

@api_router.post("/team-requests/action")
async def handle_request_action(input: RequestAction):
    request = await db.teamRequests.find_one({"id": input.requestId}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if input.action == "approve":
        await db.teams.update_one(
            {"id": request["teamId"]},
            {"$addToSet": {"memberIds": request["studentId"]}}
        )
        await db.students.update_one(
            {"id": request["studentId"]},
            {"$addToSet": {"teams": request["teamId"]}}
        )
        await db.teamRequests.update_one(
            {"id": input.requestId},
            {"$set": {"status": "approved"}}
        )
        return {"message": "Request approved successfully"}
    elif input.action == "reject":
        await db.teamRequests.update_one(
            {"id": input.requestId},
            {"$set": {"status": "rejected"}}
        )
        return {"message": "Request rejected successfully"}
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

@api_router.post("/admin/login")
async def admin_login(input: AdminLogin):
    if input.password == "AURORA":
        return {"success": True, "message": "Admin login successful"}
    else:
        raise HTTPException(status_code=401, detail="Invalid password")

@api_router.post("/admin/teams/{team_id}/approve")
async def approve_team(team_id: str):
    result = await db.teams.update_one(
        {"id": team_id},
        {"$set": {"status": "approved"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"message": "Team approved successfully"}

@api_router.post("/admin/teams/{team_id}/reject")
async def reject_team(team_id: str):
    team = await db.teams.find_one({"id": team_id}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    await db.teams.update_one(
        {"id": team_id},
        {"$set": {"status": "rejected"}}
    )
    
    await db.students.update_many(
        {"teams": team_id},
        {"$pull": {"teams": team_id}}
    )
    
    if team.get("leaderId"):
        leader_teams = await db.teams.find({"leaderId": team["leaderId"], "status": "approved"}).to_list(1000)
        if len(leader_teams) == 0:
            await db.students.update_one(
                {"id": team["leaderId"]},
                {"$set": {"isLeader": False}}
            )
    
    return {"message": "Team rejected successfully"}

@api_router.get("/admin/students", response_model=List[Student])
async def admin_get_students():
    students = await db.students.find({}, {"_id": 0}).to_list(1000)
    return [Student(**s) for s in students]

@api_router.get("/admin/teams", response_model=List[Team])
async def admin_get_teams():
    return await get_teams()

@api_router.get("/admin/requests", response_model=List[JoinRequest])
async def admin_get_all_requests():
    requests = await db.teamRequests.find({}, {"_id": 0}).to_list(1000)
    return [JoinRequest(**r) for r in requests]

@api_router.delete("/admin/students/{student_id}")
async def admin_delete_student(student_id: str):
    await db.students.delete_one({"id": student_id})
    await db.teams.update_many(
        {"memberIds": student_id},
        {"$pull": {"memberIds": student_id}}
    )
    await db.teams.update_many(
        {"leaderId": student_id},
        {"$set": {"leaderId": ""}}
    )
    await db.teamRequests.delete_many({"studentId": student_id})
    return {"message": "Student deleted successfully"}

@api_router.delete("/admin/teams/{team_id}")
async def admin_delete_team(team_id: str):
    await db.teams.delete_one({"id": team_id})
    await db.students.update_many(
        {"teams": team_id},
        {"$pull": {"teams": team_id}}
    )
    await db.teamRequests.delete_many({"teamId": team_id})
    return {"message": "Team deleted successfully"}

@api_router.post("/admin/teams/{team_id}/remove-member")
async def admin_remove_member(team_id: str, member_id: str):
    await db.teams.update_one(
        {"id": team_id},
        {"$pull": {"memberIds": member_id}}
    )
    await db.students.update_one(
        {"id": member_id},
        {"$pull": {"teams": team_id}}
    )
    return {"message": "Member removed successfully"}

@api_router.get("/admin/stats")
async def admin_get_stats():
    total_students = await db.students.count_documents({})
    total_teams = await db.teams.count_documents({})
    total_leaders = await db.students.count_documents({"isLeader": True})
    pending_requests = await db.teamRequests.count_documents({"status": "pending"})
    approved_requests = await db.teamRequests.count_documents({"status": "approved"})
    rejected_requests = await db.teamRequests.count_documents({"status": "rejected"})
    
    cse_students = await db.students.count_documents({"branch": "CSE"})
    ai_students = await db.students.count_documents({"branch": "AI"})
    
    total_events = await db.events.count_documents({})
    
    return {
        "totalStudents": total_students,
        "totalTeams": total_teams,
        "totalLeaders": total_leaders,
        "pendingRequests": pending_requests,
        "approvedRequests": approved_requests,
        "rejectedRequests": rejected_requests,
        "cseStudents": cse_students,
        "aiStudents": ai_students,
        "totalEvents": total_events
    }

class InterestRequirement(BaseModel):
    interest: str
    count: int

class EventCreate(BaseModel):
    name: str
    description: str
    interestRequirements: List[InterestRequirement]

class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str
    interestRequirements: List[dict]
    interestedStudents: List[str] = Field(default_factory=list)
    notInterestedStudents: List[str] = Field(default_factory=list)
    createdAt: str

class CompetitionCreate(BaseModel):
    name: str
    description: str
    skillsRequired: str
    rules: str
    eventDate: str

class Competition(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str
    skillsRequired: str
    rules: str
    eventDate: str
    createdAt: str

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    studentId: str
    title: str
    message: str
    type: str
    relatedId: str
    isRead: bool
    createdAt: str

class StudentInterest(BaseModel):
    eventId: str
    studentId: str
    interested: bool

@api_router.post("/events", response_model=Event)
async def create_event(input: EventCreate):
    event = Event(
        id=str(uuid.uuid4()),
        name=input.name,
        description=input.description,
        interestRequirements=[req.model_dump() for req in input.interestRequirements],
        interestedStudents=[],
        notInterestedStudents=[],
        createdAt=datetime.now(timezone.utc).isoformat()
    )
    await db.events.insert_one(event.model_dump())
    
    all_students = await db.students.find({}, {"_id": 0}).to_list(1000)
    for student in all_students:
        notification = Notification(
            id=str(uuid.uuid4()),
            studentId=student["id"],
            title="New Event Created!",
            message=f"Check out the new event: {input.name}",
            type="event",
            relatedId=event.id,
            isRead=False,
            createdAt=datetime.now(timezone.utc).isoformat()
        )
        await db.notifications.insert_one(notification.model_dump())
    
    return event

@api_router.get("/events", response_model=List[Event])
async def get_events():
    events = await db.events.find({}, {"_id": 0}).to_list(1000)
    return [Event(**e) for e in events]

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str):
    result = await db.events.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}

@api_router.post("/events/interest")
async def mark_interest(input: StudentInterest):
    event = await db.events.find_one({"id": input.eventId}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if input.interested:
        await db.events.update_one(
            {"id": input.eventId},
            {
                "$addToSet": {"interestedStudents": input.studentId},
                "$pull": {"notInterestedStudents": input.studentId}
            }
        )
        return {"message": "Marked as interested"}
    else:
        await db.events.update_one(
            {"id": input.eventId},
            {
                "$addToSet": {"notInterestedStudents": input.studentId},
                "$pull": {"interestedStudents": input.studentId}
            }
        )
        return {"message": "Marked as not interested"}

@api_router.get("/events/{event_id}/interested")
async def get_interested_students(event_id: str):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    interested_ids = event.get("interestedStudents", [])
    students = []
    
    for student_id in interested_ids:
        student = await db.students.find_one({"id": student_id}, {"_id": 0, "id": 1, "name": 1, "branch": 1, "year": 1})
        if student:
            students.append(student)
    
    return {
        "eventId": event_id,
        "eventName": event["name"],
        "requiredStudents": event["requiredStudents"],
        "interestedCount": len(interested_ids),
        "students": students
    }

class MessageCreate(BaseModel):
    teamId: str
    studentId: str
    studentName: str
    message: str

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    teamId: str
    studentId: str
    studentName: str
    message: str
    createdAt: str

@api_router.post("/teams/{team_id}/messages", response_model=Message)
async def send_message(team_id: str, input: MessageCreate):
    team = await db.teams.find_one({"id": team_id}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    message = Message(
        id=str(uuid.uuid4()),
        teamId=team_id,
        studentId=input.studentId,
        studentName=input.studentName,
        message=input.message,
        createdAt=datetime.now(timezone.utc).isoformat()
    )
    
    await db.messages.insert_one(message.model_dump())
    return message

@api_router.get("/teams/{team_id}/messages", response_model=List[Message])
async def get_team_messages(team_id: str):
    messages = await db.messages.find(
        {"teamId": team_id},
        {"_id": 0}
    ).sort("createdAt", 1).to_list(1000)
    
    return [Message(**m) for m in messages]

@api_router.delete("/teams/{team_id}/messages/{message_id}")
async def delete_message(team_id: str, message_id: str):
    result = await db.messages.delete_one({"id": message_id, "teamId": team_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"message": "Message deleted successfully"}

@api_router.post("/competitions", response_model=Competition)
async def create_competition(input: CompetitionCreate):
    competition = Competition(
        id=str(uuid.uuid4()),
        name=input.name,
        description=input.description,
        skillsRequired=input.skillsRequired,
        rules=input.rules,
        eventDate=input.eventDate,
        createdAt=datetime.now(timezone.utc).isoformat()
    )
    await db.competitions.insert_one(competition.model_dump())
    
    all_students = await db.students.find({}, {"_id": 0}).to_list(1000)
    for student in all_students:
        notification = Notification(
            id=str(uuid.uuid4()),
            studentId=student["id"],
            title="New Competition Announced!",
            message=f"{input.name} - Date: {input.eventDate}",
            type="competition",
            relatedId=competition.id,
            isRead=False,
            createdAt=datetime.now(timezone.utc).isoformat()
        )
        await db.notifications.insert_one(notification.model_dump())
    
    return competition

@api_router.get("/competitions", response_model=List[Competition])
async def get_competitions():
    competitions = await db.competitions.find({}, {"_id": 0}).to_list(1000)
    return [Competition(**c) for c in competitions]

@api_router.delete("/competitions/{competition_id}")
async def delete_competition(competition_id: str):
    result = await db.competitions.delete_one({"id": competition_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Competition not found")
    return {"message": "Competition deleted successfully"}

@api_router.get("/notifications/{student_id}", response_model=List[Notification])
async def get_student_notifications(student_id: str):
    notifications = await db.notifications.find(
        {"studentId": student_id},
        {"_id": 0}
    ).sort("createdAt", -1).to_list(100)
    return [Notification(**n) for n in notifications]

@api_router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    await db.notifications.update_one(
        {"id": notification_id},
        {"$set": {"isRead": True}}
    )
    return {"message": "Notification marked as read"}

@api_router.get("/notifications/{student_id}/unread-count")
async def get_unread_count(student_id: str):
    count = await db.notifications.count_documents({"studentId": student_id, "isRead": False})
    return {"count": count}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db():
    default_interests = [
        "Dance", "Singing", "Painting", "Poster Making",
        "Web Development", "Backend", "C", "Java"
    ]
    for interest_name in default_interests:
        existing = await db.interests.find_one({"name": interest_name})
        if not existing:
            interest = Interest(
                id=str(uuid.uuid4()),
                name=interest_name,
                createdAt=datetime.now(timezone.utc).isoformat()
            )
            await db.interests.insert_one(interest.model_dump())

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
