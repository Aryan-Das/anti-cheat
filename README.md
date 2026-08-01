# Authoritative Multiplayer Server
A simple server for a barebones top down 2d shooter game. 

## Features
- Multiplayer shooting and movement
- Match ending
- Persistent storage of match events and scores in PostgreSQL
- Docker containerized services for server, db, etc.

## File Structure
 
```
anti-cheat/
├── client/                          # frontend html client
├── db/                              # PostgreSQL database
├── game-server/                     # WebSocket server handling movement, shooting, scores, etc.
├── infra/                           # Docker compose, k8s manifests
├── matchmaking/                     # stub for matchmaking service (in development)
├── shared/                          # shared types between client and server  
└── .txt          
```

## Currently in development
- Deployment in Kubernetes
- Matchmaking service/scaling

## Future Development Plans
- ML anticheat classifier service

