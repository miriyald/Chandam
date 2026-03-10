#!/bin/bash
# Test script for Chandam API

BASE_URL="${1:-http://localhost:8080}"

echo "=== Testing Chandam API at $BASE_URL ==="
echo

# Test 1: Health check
echo "1. Health Check"
curl -s "$BASE_URL/health" | head -20
echo -e "\n"

# Test 2: List rules
echo "2. List Rules"
curl -s "$BASE_URL/api/rules" | head -30
echo -e "\n"

# Test 3: Get specific rule
echo "3. Get Rule Info (iMdravajramu)"
curl -s "$BASE_URL/api/rules/iMdravajramu" | head -40
echo -e "\n"

# Test 4: Determine Chandam
echo "4. Determine Chandam"
echo '{"poemText":"సామర్థ్యలీలన్ తతజద్విగంబుల్\nభూమిధ్రవిశ్రాంతుల బొంది యొప్పున్\nప్రేమంబుతో నైందవబింబవక్త్రున్\nహేమాంబురుం బాడుదు రింద్రవజ్రన్","language":0,"matchYati":true,"matchPrasa":true,"topMatches":1}' | \
  curl -s -X POST "$BASE_URL/api/determine" -H "Content-Type: application/json" -d @- | head -50
echo -e "\n"

# Test 5: Try Match
echo "5. Try Match (iMdravajramu)"
echo '{"poemText":"సామర్థ్యలీలన్ తతజద్విగంబుల్\nభూమిధ్రవిశ్రాంతుల బొంది యొప్పున్\nప్రేమంబుతో నైందవబింబవక్త్రున్\nహేమాంబురుం బాడుదు రింద్రవజ్రన్","ruleIdentifier":"iMdravajramu","matchYati":true,"matchPrasa":true}' | \
  curl -s -X POST "$BASE_URL/api/try-match" -H "Content-Type: application/json" -d @- | head -40
echo -e "\n"

# Test 6: Scores
echo "6. Get Scores (top matches)"
echo '{"poemText":"సామర్థ్యలీలన్ తతజద్విగంబుల్\nభూమిధ్రవిశ్రాంతుల బొంది యొప్పున్\nప్రేమంబుతో నైందవబింబవక్త్రున్\nహేమాంబురుం బాడుదు రింద్రవజ్రన్","language":0,"matchYati":true,"matchPrasa":true,"minimumMatchPercentage":80}' | \
  curl -s -X POST "$BASE_URL/api/scores" -H "Content-Type: application/json" -d @- | head -50
echo -e "\n"

echo "=== Tests Complete ==="
