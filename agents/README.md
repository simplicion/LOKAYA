# SOCIAL COMMERCE — AGENT SOURCE OF TRUTH

Read in this order:
1. Universal Agent
2. Product PRD
3. Domain Architecture
4. HLD
5. LLD
6. Database
7. Frontend + Design
8. Media
9. Engineering Practices
10. Repository + Agent Structure
11. Super Admin
12. Security Threat Model

## Core Decision
This is a DDD-oriented modular monolith, not a microservice system.

## UX Decision
One Customer/Seller application:
Customer navigation:
Home / Explore / Reels / Cart / Account

Seller workspace:
Dashboard / Products / Create / Orders / Store

A seller can use the normal shopping experience.

## Visual Direction
Premium Editorial Commerce:
social discovery + high-trust commerce, not a pixel clone of Instagram.

## Infrastructure
React/TypeScript, Node/TypeScript, PostgreSQL, Redis, R2, CDN, Socket.IO, workers, FFmpeg, HLS, Capacitor-ready.

## Important
These files are the intended architecture. Agents must inspect the actual repository before implementing anything and must not assume existing code already follows these rules.
