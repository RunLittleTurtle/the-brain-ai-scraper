<!--
This document is the single source of truth for the LLM coding assistant. The LLM should reference, update, and maintain this doc as the project evolves. All architectural, design, and implementation decisions should be reflected here.
-->

# ERD

```mermaid

erDiagram
    USER ||--o{ BUILD : "initiates"
    USER ||--o{ RUN : "initiates"

    BUILD {
        string build_id PK
        string user_id FK
        text user_objective
        json initial_target_urls
        string status
        json temporary_config_package
        json user_feedback
        json package_results
        json final_config_package
        text error_message
        datetime created_at
        datetime updated_at
    }
    BUILD }o--|| USER : "belongs to"
    BUILD }o--o{ RUN : "can lead to (if confirmed)"

    RUN {
        string run_id PK
        string build_id FK
        string user_id FK
        json target_urls
        string status
        int progress_percent
        int urls_processed
        int urls_total
        text error_message
        datetime created_at
        datetime updated_at
    }
    RUN }o--|| BUILD : "executes"
    RUN }o--|| USER : "belongs to"
    RUN ||--o{ RUN_RESULT : "produces"
    RUN ||--o{ ABTEST_RESULT : "has A/B test results"

    RUN_RESULT {
        string result_id PK
        string run_id FK
        string target_url
        boolean success
        json data
        text error
        int statusCode
        datetime timestamp
    }
    RUN_RESULT }o--|| RUN : "belongs to"

    ABTEST_RESULT {
        string abtest_id PK
        string run_id FK
        string tool_selected
        string orchestration_mode
        float response_time
        boolean success
        datetime timestamp
    }
    ABTEST_RESULT }o--|| RUN : "records A/B test for"

    USER {
        string user_id PK
        string api_key
        string name
        datetime created_at
    }

    BUILD }o--o| KNOWLEDGE_BASE_ENTRY : "can result in (on confirm)"
    KNOWLEDGE_BASE_ENTRY {
        string kb_entry_id PK
        string source_build_id FK
        json platform_identifiers
        string output_schema_hash
        string objective_embedding_id FK
        json config_package
        int usage_count
        datetime created_at
    }
    KNOWLEDGE_BASE_ENTRY }o--|| BUILD : "originates from"
    KNOWLEDGE_BASE_ENTRY ||--o| OBJECTIVE_EMBEDDING : "references vector"

    OBJECTIVE_EMBEDDING {
        string embedding_id PK
        string text_source
        vector embedding_vector
    }
    OBJECTIVE_EMBEDDING |o--|| KNOWLEDGE_BASE_ENTRY : "represents objective for"

```

