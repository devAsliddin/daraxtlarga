# Yashil Quest — Product Requirements Document

## Product Vision
A gamified civic monitoring platform where citizens of Uzbekistan verify government tree-planting claims using their smartphones, earning Green Tokens for honest reporting and exposing greenwashing through immutable blockchain records.

## Target Users
1. **Citizens** (primary): smartphone users aged 16-45 who walk/cycle near tree planting sites
2. **Administrators**: government officials and NGO monitors reviewing verification data
3. **Auditors**: anti-corruption investigators accessing evidence reports

## Core User Flows

### Flow 1: Tree Discovery & Capture
1. User opens app → sees map with "black spots" (unverified state report locations)
2. User navigates to a black spot location
3. App detects user is within 50m of target location (geofence)
4. User completes liveness challenge (3 random: blink, turn left, turn right, smile)
5. User photographs tree from 3 angles (front, side, canopy)
6. Computer vision analyzes: tree detected? health status? count matches?
7. If valid: user earns Green Tokens, tree becomes "verified" on map
8. If discrepancy: fraud report filed automatically

### Flow 2: Monthly Monitoring
1. Previously verified trees show "due for monitoring" badge
2. User revisits, photographs again
3. CV compares health status over time
4. Healthy tree: 5 GT reward. Declining tree: alert raised.

### Flow 3: Corruption Reporting
1. User finds location with no trees despite state reports
2. User submits evidence (photos + location + liveness proof)
3. System generates signed report with EXIF + blockchain hash
4. Report forwarded to E-Anticorruption platform (anticorruption.uz)
5. User earns 20 GT for confirmed discrepancy

### Flow 4: Admin Dashboard
1. Admin reviews pending verifications
2. Admin can approve/reject/flag for investigation
3. Admin sees heatmap of verified vs unverified regions
4. Admin exports reports for authorities

## Features by Priority

### P0 (Must Have)
- [ ] Interactive Leaflet map with tree markers
- [ ] Camera capture with geolocation
- [ ] Basic liveness detection (3 challenges)
- [ ] Tree detection (YOLO-based)
- [ ] Green Token accounting
- [ ] JWT authentication
- [ ] PostgreSQL persistence

### P1 (Should Have)
- [ ] Health classification (healthy/sick/dead)
- [ ] Fraud report generation
- [ ] Leaderboard
- [ ] Badges/achievements
- [ ] Admin dashboard
- [ ] Daily quests

### P2 (Nice to Have)
- [ ] NDVI approximation
- [ ] E-Anticorruption API integration
- [ ] Blockchain chaining visualization
- [ ] Push notifications (PWA)
- [ ] Offline map caching

## Success Metrics
- Trees verified per day
- Fraud detection rate (discrepancies found)
- Active users per region
- Green Tokens in circulation
- Admin review time

## Non-Functional Requirements
- Mobile-first responsive design (320px minimum)
- Map loads in <3s on 4G
- CV analysis completes in <10s
- API response time <500ms (p95)
- Works in Uzbekistan (no blocked domains)
