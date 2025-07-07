## Technical Blueprint for AI Agent: 3-Tier Choreo Deployment

**Agent's Mandate:** Translate a high-level intent (e.g., "Create a 3-tier todo app") into a production-ready application on WSO2 Choreo, encompassing code generation, source control, and full deployment lifecycle management.

**Assumptions & Pre-requisites for the Agent:**

1.  **AI-Native IDE Context:** The agent operates within an AI-native IDE (e.g., Cursor, VSCode with Copilot-like extension).
2.  **Code Generation Capability:** The agent has the internal capability to generate source code for the requested application components (e.g., HTML/CSS/JS frontend, Go/Node.js backend).
3.  **Configured GitHub Repository:**
    *   A GitHub repository is *already created* and *connected* to the local workspace where the agent operates.
    *   The `origin` remote is set up.
    *   The agent only needs to perform `git add .`, `git commit`, and `git push` operations.
4.  **Choreo MCP Server Access:**
    *   The `choreo` CLI is installed and authenticated (`choreo login` has been run).
    *   The Choreo MCP server (`choreo start-mcp-server`) is running and exposed to the agent.
    *   The agent will store `project_uuid`, `component_uuid`, `environment_uuid`, and `component_deployment_track_id` values as state after creation calls, which are crucial for subsequent monitoring and deployment.

---

### Understanding the 3-Tier Application Structure on Choreo

A 3-tier application, as requested (e.g., "Todo App" with SQLite), will be realized on Choreo as:

*   **Frontend (Tier 1 - Presentation):** A **WebApp Component** (HTML/CSS/JS served via Nginx). This will serve the static user interface.
*   **Backend (Tier 2 - Application Logic):** A **Service Component** (e.g., Go, Node.js, Python). This will expose APIs for the frontend and interact with the database.
*   **Database (Tier 3 - Data Storage):** For the specific request of using **SQLite**, the database will be a file (`.db`) embedded within the backend service's source code and deployed as part of that component. **Note:** SQLite in this setup is not a separate Choreo database service. It will reside on the ephemeral file system of the backend container.

---

### Agent's Core Logic Loop: Plan-and-Execute Framework

The agent will follow an iterative "Plan-and-Execute" loop to fulfill the user's request. Each step involves internal reasoning and subsequent interaction with external tools (GitHub CLI, Choreo MCP).

**Prompt Example:** "Create and deploy a 3-tier 'Todo App' on Choreo. Use a static HTML/CSS/JS frontend served via Nginx, a Go backend with SQLite, and ensure the code is pushed to the already connected GitHub repository."

---

### Detailed Execution Plan: Step-by-Step Guide for the Agent

The following sequence outlines the actions the AI agent must take.

#### Phase 1: Understand User Intent & Prepare Internal State

1.  **Agent's Internal Monologue:**
    *   "The user wants a 3-tier application named 'Todo App'."
    *   "Frontend: Static HTML/CSS/JS, served via Nginx. Backend: Go. Database: SQLite (embedded in backend)."
    *   "I need to generate source code, push to the pre-configured GitHub repository, and then use Choreo MCP tools for project and component setup, followed by deployment monitoring."

2.  **Agent Action (Internal/State Management):**
    *   Determine a project name (e.g., `todo-choreo-app`).
    *   Determine component names (e.g., `todo-frontend-nginx`, `todo-backend-service`).
    *   Confirm the GitHub repository URL (from internal context/user configuration).
    *   Identify local directories for generated code (e.g., `frontend/`, `backend/`).

#### Phase 2: Choreo Project & Component Creation (Pre-Code Push)

1.  **Agent's Internal Monologue:**
    *   "Before generating and pushing code, I will set up the Choreo project and components. This allows me to know the precise Git repository structure and build parameters required by Choreo when generating code, if needed, and ensures the Choreo components are ready to receive the code."

2.  **Agent Action (MCP Tool Call: `search_choreo_docs` for Project Creation):**
    *   **Tool:** `search_choreo_docs`
    *   **Input:** `{ "question": "How to create a multi-repository project on WSO2 Choreo CLI, what are the valid regions?", "context": "Project creation, multi-repository, CLI, regions" }`
    *   **Agent's Processing:** Analyze the documentation to confirm the `create_project` parameters and best practices.

3.  **Agent Action (MCP Tool Call: `create_project`):**
    *   **Tool:** `create_project`
    *   **Input:**
        ```json
        {
            "project_name": "todo-choreo-app",
            "description": "AI-generated 3-tier Todo application with static web frontend, Go, and SQLite.",
            "type": "multi-repository"
        }
        ```
    *   **Expected Output:** `{ "status": "success", "project_id": "uuid-of-project" }`
    *   **Agent's State Update:** Store the `project_id` for subsequent calls.

4.  **Agent Action (MCP Tool Call: `search_choreo_docs` for Go Service Component Creation):**
    *   **Tool:** `search_choreo_docs`
    *   **Input:** `{ "question": "How to create a Go service component on WSO2 Choreo CLI, what are the latest Go buildpack versions and required parameters for a REST service?", "context": "Go service, buildpack, REST, CLI parameters" }`
    *   **Agent's Processing:** Analyze the documentation.

5.  **Agent Action (MCP Tool Call: `get_buildpacks` for Service):**
    *   **Tool:** `get_buildpacks`
    *   **Input:** `{ "type": "service" }`
    *   **Expected Output:** A JSON array of available service buildpacks.
    *   **Agent's Processing:** Parse the output to find a suitable "go" buildpack and its supported language versions (e.g., `buildpack_id: "go"`, `buildpack_language_version: "1.x"`).

6.  **Agent Action (MCP Tool Call: `create_service_component` - Backend):**
    *   **Tool:** `create_service_component`
    *   **Input:** (Example for Go 1.21)
        ```json
        {
            "project_uuid": "uuid-of-project",
            "name": "todo-backend-service",
            "repository_url": "YOUR_GITHUB_REPO_URL.git",
            "repository_branch": "main",
            "repository_component_directory": "backend",
            "buildpack_id": "go",
            "buildpack_language_version": "1.x",
            "description": "Go backend for Todo app with SQLite",
            "endpoint_base_path": "/api",
            "endpoint_port": 8080,
            "endpoint_type": "REST"
        }
        ```
    *   **Expected Output:** `{ "status": "success", "component_id": "uuid-of-backend-component" }`
    *   **Agent's State Update:** Store `backend_component_id`.

7.  **Agent Action (MCP Tool Call: `search_choreo_docs` for Static WebApp Component Creation):**
    *   **Tool:** `search_choreo_docs`
    *   **Input:** `{ "question": "How to create a static web application component on WSO2 Choreo CLI using Nginx, what are the latest staticweb buildpack versions and required parameters?", "context": "Static web app, Nginx, buildpack, CLI parameters" }`
    *   **Agent's Processing:** Analyze the documentation.

8.  **Agent Action (MCP Tool Call: `get_buildpacks` for WebApp):**
    *   **Tool:** `get_buildpacks`
    *   **Input:** `{ "type": "webApp" }`
    *   **Expected Output:** A JSON array of available webApp buildpacks.
    *   **Agent's Processing:** Parse the output to find a suitable `staticweb` buildpack (e.g., `buildPackLang: "staticweb"`, `langVersion: "Nginx"` if available, or just `buildPackLang: "staticweb"`).

9.  **Agent Action (MCP Tool Call: `create_webapp_component` - Frontend):**
    *   **Tool:** `create_webapp_component`
    *   **Input:** (Example for staticweb)
        ```json
        {
            "project_uuid": "uuid-of-project",
            "name": "todo-frontend-nginx",
            "displayName": "Todo App Frontend",
            "buildPackLang": "staticweb",
            "langVersion": "latest",
            "repoUrl": "YOUR_GITHUB_REPO_URL.git",
            "branch": "main",
            "componentDir": "frontend",
            "port": "80" // Nginx default port
        }
        ```
    *   **Expected Output:** `{ "status": "success", "component_id": "uuid-of-frontend-component" }`
    *   **Agent's State Update:** Store `frontend_component_id`.

#### Phase 3: Code Generation & Source Control Management

1.  **Agent's Internal Monologue:**
    *   "Now that the Choreo components are defined and linked to the repository, I will generate the source code for the static HTML frontend and the Go backend with SQLite. Then, I will push these changes to the GitHub repository to trigger the Choreo builds."

2.  **Agent Action (Internal Code Generation):**
    *   Generate a standard HTML, CSS, and minimal JavaScript (for interactivity like adding/deleting todos without a framework) in the `frontend/` directory. Ensure the HTML serves as the entry point.
    *   Generate a Go application with REST endpoints (e.g., `/api/todos`) and SQLite database interaction (CRUD operations on a `todo.db` file) in the `backend/` directory. Ensure `go.mod` is properly configured.

3.  **Agent Action (GitHub CLI Interaction - Local Workspace):**
    *   **Command:** `git add .`
        *   **Purpose:** Stage all newly generated and modified files.
    *   **Command:** `git commit -m "Initial commit: AI-generated 3-tier Todo App (Static HTML/Nginx frontend, Go backend with SQLite)"`
        *   **Purpose:** Commit the staged changes with a descriptive message.
    *   **Command:** `git push origin main` (or `git push origin master`)
        *   **Purpose:** Push the committed code to the remote GitHub repository.
        *   **Verification:** Ensure command returns successfully. If not, inform the user about the Git error and halt.

#### Phase 4: Build & Deployment Orchestration (Monitoring Automatic Processes)

1.  **Agent's Internal Monologue:**
    *   "Choreo automatically triggers a build and deployment when a component's linked repository receives a new commit. I need to monitor these processes for both the backend and frontend components until they are `ACTIVE`."
    *   "First, I need the environment UUID (typically 'Development') and the deployment track IDs for each component."

2.  **Agent Action (MCP Tool Call: `get_project_environments`):**
    *   **Tool:** `get_project_environments`
    *   **Input:** `{ "project_uuid": "uuid-of-project" }`
    *   **Expected Output:** A list of environments.
    *   **Agent's Processing:** Identify the `uuid` for the "Development" environment. Store it as `dev_environment_uuid`.

3.  **Agent Action (MCP Tool Call: `get_component` for Deployment Track IDs):**
    *   **Tool:** `get_component`
    *   **Input (Backend):** `{ "project_uuid": "uuid-of-project", "component_uuid": "uuid-of-backend-component" }`
    *   **Expected Output:** Component details, extract `component_deployment_track_id` for backend.
    *   **Input (Frontend):** `{ "project_uuid": "uuid-of-project", "component_uuid": "uuid-of-frontend-component" }`
    *   **Expected Output:** Component details, extract `component_deployment_track_id` for frontend.
    *   **Agent's State Update:** Store `backend_track_id` and `frontend_track_id`.

4.  **Agent Action (MCP Tool Call: `search_choreo_docs` for Build/Deployment Monitoring):**
    *   **Tool:** `search_choreo_docs`
    *   **Input:** `{ "question": "How to monitor build and deployment status for components on WSO2 Choreo CLI and retrieve logs for debugging?", "context": "Build status, deployment status, logs, CLI" }`
    *   **Agent's Processing:** Analyze the documentation for correct polling methods and log retrieval.

5.  **Agent Action (Loop for Backend Status Monitoring):**
    *   **Agent's Internal Monologue:** "Continuously check the build and deployment status of the backend service until it is active."
    *   **Loop Condition:** `backend_deployment_status != "ACTIVE"`
    *   **Inside Loop (with reasonable delay between polls):**
        *   **Tool:** `get_builds`
        *   **Input:** `{ "project_uuid": "uuid-of-project", "component_uuid": "uuid-of-backend-component", "component_deployment_track_id": "backend_track_id" }`
        *   **Agent's Processing:** Find the latest build. Check `status.conclusion`.
            *   If `status.conclusion == "FAILED"`:
                *   **Tool:** `build_logs`
                *   **Input:** `{ "component_uuid": "uuid-of-backend-component", "project_uuid": "uuid-of-project", "environment_uuid": "dev_environment_uuid", "component_deployment_track_id": "backend_track_id", "build_status_run_id": "latest_build_run_id", "build_log_step": "build" }` (or other relevant step)
                *   **Agent's Action:** Analyze logs, report failure and potential cause to user. Halt or suggest retry.
            *   If `status.conclusion == "SUCCESS"`: Proceed to check deployment status.
        *   **Tool:** `get_deployment`
        *   **Input:** `{ "project_uuid": "uuid-of-project", "component_uuid": "uuid-of-backend-component", "environment_uuid": "dev_environment_uuid" }`
        *   **Agent's Processing:** Check `deploymentStatus`.
            *   If `deploymentStatus == "FAILED"`:
                *   **Tool:** `application_logs` or `gateway_logs`
                *   **Input:** (similar to `build_logs` but with relevant `log_type` and `execution_id` if available)
                *   **Agent's Action:** Analyze logs, report failure and potential cause to user. Halt or suggest retry.
            *   If `deploymentStatus == "ACTIVE"`: Break loop.

6.  **Agent Action (Loop for Frontend Status Monitoring):**
    *   Repeat step 5 for the `todo-frontend-nginx` component, using `uuid-of-frontend-component` and `frontend_track_id`.

#### Phase 5: Verification & Reporting Final Status

1.  **Agent's Internal Monologue:**
    *   "Both backend and frontend components are now successfully built and deployed. I need to retrieve the public URL of the frontend web application and report it to the user."

2.  **Agent Action (MCP Tool Call: `search_choreo_docs` for Final URL Retrieval):**
    *   **Tool:** `search_choreo_docs`
    *   **Input:** `{ "question": "How to get the public URL of a deployed web application component on WSO2 Choreo CLI?", "context": "Web app URL, deployed component, CLI" }`
    *   **Agent's Processing:** Analyze the documentation for correct URL retrieval.

3.  **Agent Action (MCP Tool Call: `get_deployment` for Frontend URL):**
    *   **Tool:** `get_deployment`
    *   **Input:** `{ "project_uuid": "uuid-of-project", "component_uuid": "uuid-of-frontend-component", "environment_uuid": "dev_environment_uuid" }`
    *   **Expected Output:** Deployment details for the frontend.
    *   **Agent's Processing:** Extract the `invokeUrl` from the output JSON.

4.  **Agent's Final Report (To User in IDE):**
    *   "Deployment successful. Your 'Todo App' is live and accessible at: `[extracted_invoke_url]`"
    *   "The backend service is also deployed and accessible internally within Choreo by the frontend. You can find its details in the Choreo console under project `todo-choreo-app`."
