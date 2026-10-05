# Smart Complaint & Issue Tracking System

A web-based platform for managing internal organizational complaints — from submission to resolution — with role-based access, full action history, and analytics.

**Roles:** Admin · Employee · Staff
**Stack:** React.js · Node.js · Express.js · MongoDB · MVC

> 📄 **Full documentation (SRS, user manual, features, sprint details):**
> [View SRS Document](docs/SRS.pdf) · [Project Documentation](./docs/)

---

## What We Built

- Role-based access control (Admin / Employee / Staff)
- Admin-managed user accounts (create, update, deactivate)
- Complaint submission with title, description, category, priority & attachments
- Department routing (HR, IT, Finance, Marketing & Sales, Software & Product Development)
- Status workflow: Pending → Assigned → In Progress → Resolved
- Activity timeline / action history
- Resolution comments and notes
- Priority escalation (up to Critical)
- Automated notifications
- Search & filter (keyword, category, status, priority)
- Admin dashboard with department-wise, priority-wise & resolution time analytics

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Architecture | MVC |

---

## Who Built It

| Student ID | Name | Contribution |
|------------|------|--------------|
| 24341132 | Saikat Rahman Asif | Backend, MongoDB schema, MVC, auth & RBAC |
| 20101047 | Ifaz Ahanaf Zaman | Complaint management, assignment, status workflow |
| 23101205 | Mohammed Tashfiqul Islam | Frontend (React), dashboards, forms, search & filter |
| 24101302 | Yasin Musa Saad | Analytics, priority escalation, UML, documentation |

---

## How to Deploy

### Prerequisites
- Node.js v18+
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))
- npm

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/SRS_Group_8.git
cd SRS_Group_8
