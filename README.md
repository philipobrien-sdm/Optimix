# OptiMix: Bento Grid Resource Leverager & Scheduler

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

### 3. Integrated Outlook mailroom Flow
*   **One-Click Resource Mailing**: Trigger your default mail client (Outlook / mailto) automatically loaded with recipients, subject coordinates, and discussion agendas for selected meetings.

### 4. Recurrence Operations
*   Configure scheduled discussions as `Once`, `Weekly`, `Bi-Weekly`, or `Monthly` recurrence intervals.

### 5. Automated Utilization Dispatcher
*   Define recurrence intervals to generate and compile structural utilization digests and email them directly to managing executives.

### 6. Complete Application State Backup & Restore (JSON Engine)
*   **One-Click Backup**: Download the entire application snapshot—including custom team rosters, scheduling calendars, free-text constraints, email contacts, and Local LLM connection configurations—into a neat `.json` file.
*   **One-Click Load**: Upload a previously saved snapshot to instantly restore all database variables, roster settings, and active configurations on any device without session loss.

---

## 🧠 Smart AI Recommendation Model Setup

OptiMix leverages a dual-engine recommendation matrix to assign recommended resources to scheduled topics. Managers can choose between:

1.  **Cloud-Powered Gemini AI**: Utilizes `gemini-3.5-flash` to evaluate skills, constraints, learning pathways, and consistency indexes.
2.  **Private Local LLM Integration**: Run 100% private, offline inference on your computer via **Ollama** or **LM Studio / Llama.cpp**.

---

## 🛠️ Offline Local LLM Installation and CORS Setup

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
