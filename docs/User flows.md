# User Flows

## 1. User flow - Initial Build & Immediate Confirmation

```mermaid
flowchart LR
    %% --- Color Definitions ---
    classDef userAction fill:#ff006e,stroke:#8338ec,stroke-width:2px,color:#000;
    classDef systemProcess fill:#3a86ff,stroke:#8338ec,stroke-width:1px,color:#000;
    classDef apiCall fill:#2ec4b6,stroke:#8338ec,stroke-width:1.5px,color:#000;
    classDef decisionPoint fill:#fb5607,stroke:#8338ec,stroke-width:2px,color:#000;
    classDef finalState fill:#ffbe0b,stroke:#8338ec,stroke-width:3px,color:#000;
    classDef legendText fill:#fff,stroke:#333,color:#333;

    %% --- Flowchart Steps ---
    A([Dev defines Objective & URLs in UI])
    B([Dev clicks 'Build Scraper'])
    C(["/POST /builds/ (SaaS Backend)"])
    D(["Brain API processes<br/>UI shows 'Building...'"])
    E(["UI shows 'Ready for Review'<br/>+ Sample Results"])
    F{{Dev reviews Samples & JSON Output}}
    G([Dev clicks 'Confirm Scraper'])
    H(["/POST /builds_confirm/ (SaaS Backend)"])
    I(["Brain API saves config<br/>UI Updates"])
    J(((Scraper Confirmed – Ready to Run)))

    %% --- Flow Connections ---
    A --> B
    B -- "Triggers" --> C
    C --> D
    D -- "Polls GET /builds" --> E
    E --> F
    F -- "Looks Good!" --> G
    G -- "Triggers" --> H
    H --> I
    I --> J

    %% --- Class assignments ---
    class A,B,G userAction;
    class C,H apiCall;
    class D,E,I systemProcess;
    class F decisionPoint;
    class J finalState;

    %% --- Legend ---
    subgraph Legend
        direction LR
        L1[User Action]:::legendText -- : --> L1Ex([User does something]):::userAction
        L2[API Call]:::legendText -- : --> L2Ex(["/API Call/"]):::apiCall
        L3[System/UI Process]:::legendText -- : --> L3Ex([System step]):::systemProcess
        L4[User Review / Decision]:::legendText -- : --> L4Ex{{Decision}}:::decisionPoint
        L5[Final Outcome]:::legendText -- : --> L5Ex(((End))):::finalState
    end



```

## 2. Userflow - Build with One Round of Feedback


```mermaid
flowchart LR
    %% --- Color Definitions ---
    classDef userAction fill:#ff006e,stroke:#8338ec,stroke-width:2px,color:#000;
    classDef systemProcess fill:#3a86ff,stroke:#8338ec,stroke-width:1px,color:#000;
    classDef apiCall fill:#2ec4b6,stroke:#8338ec,stroke-width:1.5px,color:#000;
    classDef decisionPoint fill:#fb5607,stroke:#8338ec,stroke-width:2px,color:#000;
    classDef finalState fill:#ffbe0b,stroke:#8338ec,stroke-width:3px,color:#000;
    classDef legendText fill:#fff,stroke:#333,color:#333;

    %% --- Flowchart Steps ---
    A[Dev defines Objective & URLs] 
    B[Dev clicks 'Build Scraper']
    C(["SaaS Backend:<br/>POST /builds"])
    D(["Brain API processes /<br/>UI shows 'Building...'"])
    E(["UI shows 'Ready for Review'<br/>Displays initial samples"])
    F{Dev reviews Initial Samples}
    G[Dev enters feedback/corrections in UI]
    H[Dev clicks 'Refine Configuration']
    I(["SaaS Backend:<br/>POST /builds/{id}/configure"])
    J(["Brain API adjusts & re-runs /<br/>UI shows 'Refining...'"])
    K(["UI shows 'Ready for Final Review'<br/>Displays refined samples"])
    L{Dev reviews Refined Samples}
    M[Dev clicks 'Confirm Scraper']
    N(["SaaS Backend:<br/>POST /builds/{id}/confirm"])
    O(["Brain API saves final config /<br/>UI Updates"])
    P(["UI shows 'Scraper Confirmed!'<br/>Ready to Run"])

    %% --- Flow Connections ---
    A --> B
    B -- Triggers --> C
    C --> D
    D -- "SaaS polls" --> E
    E --> F
    F -- "Needs Changes" --> G
    G --> H
    H -- Triggers --> I
    I --> J
    J -- "SaaS polls" --> K
    K --> L
    L -- "Looks Good Now!" --> M
    M -- Triggers --> N
    N --> O
    O --> P

    %% --- Class assignments ---
    class A,B,G,H,M userAction;
    class C,I,N apiCall;
    class D,E,J,K,O systemProcess;
    class F,L decisionPoint;
    class P finalState;

    %% --- Legend ---
    subgraph Legend
        direction LR
        L1[User Action]:::legendText -- : --> L1Ex[ ]:::userAction
        L2[API Call Trigger]:::legendText -- : --> L2Ex[ ]:::apiCall
        L3[System Process / UI State]:::legendText -- : --> L3Ex([" "]):::systemProcess
        L4[User Decision / Review]:::legendText -- : --> L4Ex{ }:::decisionPoint
        L5[Final Outcome]:::legendText -- : --> L5Ex([" "]):::finalState
    end


```

## 3. Userflow - **Managing Existing Scraper Configurations**

**Goal:** The developer wants to see, organize, or possibly delete the scraper configurations they have previously built and confirmed.


```mermaid
flowchart LR
    %% --- Color Definitions ---
    classDef userAction fill:#ff006e,stroke:#8338ec,stroke-width:2px,color:#000;
    classDef systemProcess fill:#3a86ff,stroke:#8338ec,stroke-width:1px,color:#000;
    classDef apiCall fill:#2ec4b6,stroke:#8338ec,stroke-width:1.5px,color:#000;
    classDef decisionPoint fill:#fb5607,stroke:#8338ec,stroke-width:2px,color:#000;
    classDef finalState fill:#ffbe0b,stroke:#8338ec,stroke-width:3px,color:#000;
    classDef legendText fill:#fff,stroke:#333,color:#333;

    %% --- Flowchart Steps ---
    A[Dev navigates to 'My Scrapers']
    B(["SaaS Backend:<br/>Fetch User's Builds (Internal Query)"])
    C(["UI Displays List of<br/>Confirmed Scrapers"])
    D{Dev Reviews List}
    E[Dev Clicks 'Delete']
    F(["SaaS Backend:<br/>Delete Record /<br/>Call DELETE /builds/{id}?"])
    G(["UI Updates List"])
    H(["List Management Complete"])

    %% --- Flow Connections ---
    A --> B
    B --> C
    C --> D
    D -- "Selects a Scraper" --> E
    E -- "Triggers" --> F
    F --> G
    G --> H
    D -- "Done Reviewing" --> H

    %% --- Class assignments ---
    class A,E userAction;
    class B,F apiCall;
    class C,G systemProcess;
    class D decisionPoint;
    class H finalState;

    %% --- Legend ---
    subgraph Legend
        direction LR
        L_Text_UserAction[User Action]:::legendText -- : --> L_Swatch_UserAction[ ]:::userAction
        L_Text_ApiCall[API/Backend Call]:::legendText -- : --> L_Swatch_ApiCall[ ]:::apiCall
        L_Text_SystemProcess[System Process / UI State]:::legendText -- : --> L_Swatch_SystemProcess([" "]):::systemProcess
        L_Text_DecisionPoint[User Decision / Review]:::legendText -- : --> L_Swatch_DecisionPoint{ }:::decisionPoint
        L_Text_FinalState[Final Outcome]:::legendText -- : --> L_Swatch_FinalState([" "]):::finalState
    end


```

## 4. Userflow - Executing a Full Scrape


```mermaid
flowchart LR
    %% --- Color Definitions ---
    classDef userAction fill:#ff006e,stroke:#8338ec,stroke-width:2px,color:#000;
    classDef systemProcess fill:#3a86ff,stroke:#8338ec,stroke-width:1px,color:#000;
    classDef apiCall fill:#2ec4b6,stroke:#8338ec,stroke-width:1.5px,color:#000;
    classDef decisionPoint fill:#fb5607,stroke:#8338ec,stroke-width:2px,color:#000;
    classDef finalState fill:#ffbe0b,stroke:#8338ec,stroke-width:3px,color:#000;
    classDef legendText fill:#fff,stroke:#333,color:#333;

    %% --- Flowchart Steps ---
    A[Dev selects confirmed Scraper/Project]
    B[Dev adds/confirms Target URLs]
    C[Dev clicks 'Run Scrape Now']
    D(["SaaS Backend:<br/>POST /runs with config"])
    E(["Brain API executes full scrape /<br/>UI shows 'Run Initiated...'"])
    F(["UI updates<br/>Progress %"])
    G(["UI shows 'Run Complete'<br/>Provides Results/Download"])
    H(["UI shows 'Run Failed'<br/>Displays Error"])

    %% --- Flow Connections ---
    A --> B
    B --> C
    C -- "Triggers" --> D
    D --> E
    E -- "SaaS polls GET /runs" --> F
    F -- "Run In Progress" --> E
    F -- "Run Completed" --> G
    F -- "Run Failed" --> H

    %% --- Class assignments ---
    class A,B,C userAction;
    class D apiCall;
    class E,F systemProcess;
    class G,H finalState;

    %% --- Legend ---
    subgraph Legend
        direction LR
        L_Text_UserAction[User Action]:::legendText -- : --> L_Swatch_UserAction[ ]:::userAction
        L_Text_ApiCall[API Call Trigger]:::legendText -- : --> L_Swatch_ApiCall[ ]:::apiCall
        L_Text_SystemProcess[System Process / UI State]:::legendText -- : --> L_Swatch_SystemProcess([" "]):::systemProcess
        L_Text_DecisionPoint[User Decision / Review]:::legendText -- : --> L_Swatch_DecisionPoint{ }:::decisionPoint
        L_Text_FinalState[Final Outcome]:::legendText -- : --> L_Swatch_FinalState([" "]):::finalState
    end


```

## 5. Userflow -  **Re-building/Modifying a Scraper Configuration**

**Goal:** The objective or target sites for a previously built scraper have changed slightly. Instead of starting from scratch, the developer wants to adjust the existing setup. (Note: The Brain might just treat this as a *new* build internally, but the UI flow feels like modification).

```mermaid
flowchart LR
    %% --- Color Definitions ---
    classDef userAction fill:#ff006e,stroke:#8338ec,stroke-width:2px,color:#000;
    classDef systemProcess fill:#3a86ff,stroke:#8338ec,stroke-width:1px,color:#000;
    classDef apiCall fill:#2ec4b6,stroke:#8338ec,stroke-width:1.5px,color:#000;
    classDef decisionPoint fill:#fb5607,stroke:#8338ec,stroke-width:2px,color:#000;
    classDef finalState fill:#ffbe0b,stroke:#8338ec,stroke-width:3px,color:#000;
    classDef legendText fill:#fff,stroke:#333,color:#333;

    %% --- Flowchart Steps ---
    A[Dev selects existing Scraper Config]
    B[Dev clicks 'Modify']
    C(["UI Pre-fills Build Form<br/>with old Objective & URLs"])
    D[Dev edits Objective / URLs]
    E[Dev clicks 'Re-build Scraper']
    F(["SaaS Backend:<br/>POST /builds (with NEW data)"])
    G((Go to Initial Build Flow<br/>e.g., Flow 1, 2, or 3))

    %% --- Flow Connections ---
    A --> B
    B --> C
    C --> D
    D --> E
    E -- "Triggers" --> F
    F --> G

    %% --- Class assignments ---
    class A,B,D,E userAction;
    class C systemProcess;
    class F apiCall;
    class G finalState;

    %% --- Legend ---
    subgraph Legend
        direction LR
        L_Text_UserAction[User Action]:::legendText -- : --> L_Swatch_UserAction[ ]:::userAction
        L_Text_ApiCall[API Call Trigger]:::legendText -- : --> L_Swatch_ApiCall[ ]:::apiCall
        L_Text_SystemProcess[System Process / UI State]:::legendText -- : --> L_Swatch_SystemProcess([" "]):::systemProcess
        L_Text_DecisionPoint[User Decision / Review]:::legendText -- : --> L_Swatch_DecisionPoint{ }:::decisionPoint
        L_Text_FinalState[Final Outcome]:::legendText -- : --> L_Swatch_FinalState((End)):::finalState
    end



```