#!/usr/bin/env bash
# Set up Ollama models for Yashil Quest

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "======================================================"
echo "  Yashil Quest - Ollama Model Setup"
echo "======================================================"

if ! command -v ollama &>/dev/null; then
  echo -e "${RED}[ERROR]${NC} Ollama o'rnatilmagan!"
  echo ""
  echo "O'rnatish uchun:"
  echo "  Linux/Mac: curl -fsSL https://ollama.ai/install.sh | sh"
  echo "  Windows: https://ollama.ai/download"
  exit 1
fi

echo -e "${GREEN}[OK]${NC} Ollama topildi"

# Check if Ollama is running
if ! ollama list &>/dev/null 2>&1; then
  echo -e "${YELLOW}[WARN]${NC} Ollama ishlamayapti. Ishga tushirishga urinilmoqda..."
  if command -v systemctl &>/dev/null; then
    systemctl start ollama 2>/dev/null || true
  fi
  sleep 3
fi

MODELS=(
  "llama3.1:8b"
  "llava:7b"
  "nomic-embed-text"
)

echo ""
echo "Modellar yuklanmoqda..."
echo ""

for model in "${MODELS[@]}"; do
  echo -e "${YELLOW}[PULL]${NC} $model yuklanmoqda..."
  if ollama pull "$model"; then
    echo -e "${GREEN}[OK]${NC} $model tayyor"
  else
    echo -e "${YELLOW}[WARN]${NC} $model yuklanmadi. Keyinroq yuklashingiz mumkin."
  fi
  echo ""
done

echo "======================================================"
echo -e "${GREEN}Ollama sozlandi!${NC}"
echo ""
echo "Mavjud modellar:"
ollama list
echo ""
echo "Yashil Quest AI xususiyatlari tayyor:"
echo "  - llama3.1:8b: Daraxt holati tahlili, firibgarlik aniqlash"
echo "  - llava:7b: Rasmlar tahlili (multivision)"
echo "  - nomic-embed-text: Semantik qidiruv"
echo "======================================================"
