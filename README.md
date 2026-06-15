# OptiMix: Resource Leverager & Scheduler

<img width="1333" height="783" alt="Screenshot 2026-06-15 114440" src="https://github.com/user-attachments/assets/d62bf160-8ae1-4882-9e69-c6a6dd90c6ab" />

OptiMix is a high-fidelity, high-contrast, visual "Bento Grid" dashboard designed to help managers see, track, and maximize team resource utilization across complex schedules. Operating in terms of **Availability**, **Expertise Alignment**, **Learning Opportunities**, and **Consistency of Presence**, OptiMix aligns scheduled topics to active resources dynamically.

With real-time client cache synchronization and local-first persistence, managers can build secure schedules, identify bottleneck discussions, enroll team capacities, and leverage local or cloud AI suggestion engines to optimize team performance.

---

## 🚀 Key Features

### 1. Unified Bento Dashboard & Timeline
*   **Visual Utilization Dial**: Tracks the final 10% of team potential and displays active allocation indexes.
*   **Availability Timeline**: Interactive scheduling grid tracking Monday–Friday blocks.
*   **Bottleneck & Overlap Alerter**: Highlights meetings where no qualified or available experts exist, prompting managers with immediate risk visualizers.

### 2. Flexible Team Roster Registry (CSV Engine)
*   **Robust CSV Importer**: Drag-and-drop or upload custom team rosters dynamically.
*   **Availability Constraints**: Type or import free-text availability constraints (e.g., *"No afternoons"*, *"Remote only Fridays"*) that are immediately fed to the assignment recommendation models.
*   **Blocked-Off Times**: Allow team members to block out hours/days when they are unavailable, which instantly forms scheduling exclusion rules.
*   **CSV Template Downloader**: Download an out-of-the-box structured CSV template straight from the app to configure rosters quickly.

<img width="1304" height="755" alt="Screenshot 2026-06-15 114522" src="https://github.com/user-attachments/assets/776f2641-21f7-4cd4-99ce-1da2a784902f" />
<img width="1322" height="604" alt="Screenshot 2026-06-15 114541" src="https://github.com/user-attachments/assets/456fc346-7d24-430b-ab34-acba4cc14649" />
### 3. Integrated Outlook mailroom Flow
*   **One-Click Resource Mailing**: Trigger your default mail client (Outlook / mailto) automatically loaded with recipients, subject coordinates, and discussion agendas for selected meetings.

<img width="436" height="153" alt="Screenshot 2026-06-15 114908" src="https://github.com/user-attachments/assets/265f4c8a-6d83-446f-b01d-d9fa1be60b61" />

### 4. Recurrence Operations
*   Configure scheduled discussions as `Once`, `Weekly`, `Bi-Weekly`, or `Monthly` recurrence intervals.


### 5. Automated Utilization Dispatcher
*   Define recurrence intervals to generate and compile structural utilization digests and email them directly to managing executives.
<img width="660" height="321" alt="Screenshot 2026-06-15 114503" src="https://github.com/user-attachments/assets/b87d9277-1410-4e93-9994-9cddd1d14735" />

### 6. Complete Application State Backup & Restore (JSON Engine)
*   **One-Click Backup**: Download the entire application snapshot—including custom team rosters, scheduling calendars, free-text constraints, email contacts, and Local LLM connection configurations—into a neat `.json` file.
*   **One-Click Load**: Upload a previously saved snapshot to instantly restore all database variables, roster settings, and active configurations on any device without session loss.

---

## 🧠 Smart AI Recommendation Model Setup

OptiMix leverages a dual-engine recommendation matrix to assign recommended resources to scheduled topics. Managers can choose between:

1.  **Cloud-Powered Gemini AI**: Utilizes `gemini-3.5-flash` to evaluate skills, constraints, learning pathways, and consistency indexes.
2.  **Private Local LLM Integration**: Run 100% private, offline inference on your computer via **Ollama** or **LM Studio / Llama.cpp**.
<img width="514" height="246" alt="Screenshot 2026-06-15 115023" src="https://github.com/user-attachments/assets/23ec0589-395f-44d2-9820-2ae2ee3cdd4b" />

---

## 🛠️ Offline Local LLM Installation and CORS Setup
<img width="600" height="669" alt="Screenshot 2026-06-15 114549" src="https://github.com/user-attachments/assets/1fa42f3c-569f-493a-beb2-53853f4492c6" />

To run OptiMix with your local private LLM:

### For Ollama (Mac, Linux, Windows)
By default, Ollama blocks cross-origin requests (`CORS`) made from client browsers. You must unblock Ollama by setting origin environment variables before starting the server.

1.  **Exit Ollama** completely from your toolbar/active background processes.
2.  **Start Ollama with CORS origins enabled**:
    *   **macOS / Linux (Terminal)**:
        ```bash
        OLLAMA_ORIGINS="*" ollama serve
        ```
    *   **Windows (PowerShell)**:
        ```powershell
        $env:OLLAMA_ORIGINS="*"
        ollama serve
        ```
3.  Open the **Local LLM Setup** modal inside OptiMix, set Format to **Ollama**, and click **Test localhost connection**. 
4.  Once connected, select any model downloaded locally (e.g., `llama3.2`, `gemma2`) and save.

### For LM Studio
1.  Open LM Studio and navigating to the **Local Server** section (`⚡` tab).
2.  Start the server specifying port `1234` or custom.
3.  Ensure CORS is enabled in the configuration panel.
4.  In OptiMix, set format to **OpenAI / LM Studio**, specify `http://localhost:1234`, and select your loaded model.

---

## 🖥️ Local Hosting and Developer Setup

To run OptiMix's full-stack container on your local developer machine:

### Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory based on the `.env.example` template:
```env
# Optional: Provide active Gemini Key for cloud suggestions
GEMINI_API_KEY="YOUR_KEY_HERE"
```

### 3. Start Development Server
```bash
npm run dev
```
The server will start, exposing the multi-panel Bento Grid dashboard on `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
npm run start
```
The application compiles into bundled statics and initiates standalone standalone distribution serving.
