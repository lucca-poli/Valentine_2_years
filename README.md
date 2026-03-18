# Gift for my Valentine

Gift of 2 years for my girlfriend. Mini-game made with PixiJS

## 🎮 Game Flow

1. **Intro Scene**: You walk towards an airplane and enter it
2. **Flight Game**: JetpackJoyride style obstacle avoidance (press SPACE to go up, but instead of jumping it start going up with the function 1-e^(x/x_0))
3. **Arrival**: You exit the plane and approach your girlfriend
4. **Kissing Scene**: Cloud covers you both with hearts popping out
5. **The Question**: "Do you want to be my Valentine?" with Yes/No buttons
6. **Final Scene**: Big beating heart appears when she clicks Yes!

## 🚀 How to Run Locally

### Option 1: Local Server (Recommended)

**With Python:**
```bash
# In the valentine-game folder
python -m http.server 8000
# Visit: http://localhost:8000
```

**With NixOS:**
```bash
nix-shell -p python3 --run "python -m http.server 8000"
# Visit: http://localhost:8000
```

**With Node.js:**
```bash
npm run start
# Visit: http://localhost:5173
```

## 🐛 Troubleshooting

**Sound not loading//Yes no clicking?**
Make sure that in src/manifest.json there's
```
        {
          "alias": [
            "Coisa_de_Cinema"
          ],
          "src": [
            "audio/Coisa_de_Cinema"
          ],
          "data": {
            "tags": {}
          }
        },
        {
          "alias": [
            "airplane_audio"
          ],
          "src": [
            "audio/airplane_audio"
          ],
          "data": {
            "tags": {}
          }
        },
```

