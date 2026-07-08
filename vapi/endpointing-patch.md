# Endpointing (turn-taking) tuning

Vapi's smart endpointing is optimized for English speech patterns, so on Japanese
it tends to cut the caller off or wait too long. Instead of relying on it, tune the
timers directly for Japanese rhythm.

PATCH the assistant (top-level fields, NOT inside `model`):

```bash
curl -X PATCH https://api.vapi.ai/assistant/YOUR_ASSISTANT_ID \
  -H "Authorization: Bearer YOUR_VAPI_PRIVATE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "startSpeakingPlan": {
      "waitSeconds": 0.4,
      "transcriptionEndpointingPlan": {
        "onPunctuationSeconds": 0.1,
        "onNoPunctuationSeconds": 1.3,
        "onNumberSeconds": 0.5
      }
    }
  }'
```

Notes:
- `waitSeconds` — pause after the caller stops before the agent replies. Lower = snappier,
  too low = cuts them off.
- `onNoPunctuationSeconds` — Japanese STT rarely emits punctuation, so this timer fires a
  lot; it's the one that most affects Japanese turn-taking. Start ~1.3s and adjust by ear.
- If you enable `smartEndpointingPlan`, test it on Japanese — it may misjudge turn ends.
