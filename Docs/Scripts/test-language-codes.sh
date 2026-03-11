#!/bin/bash
# Test language code support in Chandam API

BASE_URL="${1:-http://localhost:8080}"

echo "=== Testing Language Code Support ==="
echo

# Test 1: List supported languages
echo "1. List Supported Languages"
curl -s "$BASE_URL/api/languages" | head -30
echo -e "\n"

# Test 2: List rules with ISO code "te"
echo "2. List Telugu Rules (language=te)"
curl -s "$BASE_URL/api/rules?language=te" | head -20
echo -e "\n"

# Test 3: List rules with full name "Telugu"
echo "3. List Telugu Rules (language=Telugu)"
curl -s "$BASE_URL/api/rules?language=Telugu" | head -20
echo -e "\n"

# Test 4: List rules with numeric value "0"
echo "4. List Telugu Rules (language=0)"
curl -s "$BASE_URL/api/rules?language=0" | head -20
echo -e "\n"

# Test 5: Determine with language code "te"
echo "5. Determine with language='te'"
echo '{"poemText":"సామర్థ్యలీలన్ తతజద్విగంబుల్\nభూమిధ్రవిశ్రాంతుల బొంది యొప్పున్\nప్రేమంబుతో నైందవబింబవక్త్రున్\nహేమాంబురుం బాడుదు రింద్రవజ్రన్","language":"te","matchYati":true,"matchPrasa":true}' | \
  curl -s -X POST "$BASE_URL/api/determine" -H "Content-Type: application/json" -d @- | head -30
echo -e "\n"

# Test 6: Determine with numeric value 0
echo "6. Determine with language=0 (numeric)"
echo '{"poemText":"సామర్థ్యలీలన్ తతజద్విగంబుల్\nభూమిధ్రవిశ్రాంతుల బొంది యొప్పున్\nప్రేమంబుతో నైందవబింబవక్త్రున్\nహేమాంబురుం బాడుదు రింద్రవజ్రన్","language":0,"matchYati":true,"matchPrasa":true}' | \
  curl -s -X POST "$BASE_URL/api/determine" -H "Content-Type: application/json" -d @- | head -30
echo -e "\n"

# Test 7: Scores with language code
echo "7. Scores with language='te'"
echo '{"poemText":"సామర్థ్యలీలన్ తతజద్విగంబుల్\nభూమిధ్రవిశ్రాంతుల బొంది యొప్పున్\nప్రేమంబుతో నైందవబింబవక్త్రున్\nహేమాంబురుం బాడుదు రింద్రవజ్రన్","language":"te","minimumMatchPercentage":90}' | \
  curl -s -X POST "$BASE_URL/api/scores" -H "Content-Type: application/json" -d @- | head -30
echo -e "\n"

echo "=== Language Code Tests Complete ==="
echo
echo "Supported formats:"
echo "  - ISO 639-1: 'te', 'kn', 'sa', 'hi', 'ml'"
echo "  - ISO 639-2: 'tel', 'kan', 'san', 'hin', 'mal'"
echo "  - Full names: 'Telugu', 'Kannada', 'Sanskrit', 'Hindi', 'Malayalam'"
echo "  - Numeric: 0 (Telugu), 1 (Kannada), 2 (Sanskrit), 3 (Hindi), 4 (Malayalam)"
