# SkillForge

SkillForge is a portfolio learning-platform project inspired by Udemy.

The backend currently has:

- Better Auth user/session/account/verification tables.
- A PostgreSQL + Drizzle database design for courses, teachers, students, carts, payments, enrollments, progress, certificates, reviews, and lesson Q&A.
- A generated Drizzle migration for the current database design.

## Database Guide

Read the full beginner-friendly database explanation here:

[DATABASE_DESIGN.md](./DATABASE_DESIGN.md)

That document explains:

- What each table does.
- How the relations work.
- Why the schema is designed this way.
- How the business flow works.
- Visual Mermaid diagrams.
- What should be built next.
- Future ideas like blogs, subscriptions, PayPal, bank transfer, chat, and video calls.

## Important Files

```txt
server/src/db/schemas/schema.ts
server/src/db/migrations/0000_dashing_omega_red.sql
DATABASE_DESIGN.md
```

## Current Database Mental Model

```txt
Auth tells us who the user is.
Profiles tell us what the user does.
Courses tell us what teachers sell.
Orders and payments tell us what students bought.
Enrollments tell us what students can access.
Progress tells us what students completed.
Certificates prove completion.
Reviews and Q&A make the course feel real.
```
