# Definition of Done (DoD) for LLM

The LLM ("Windsurf") will autonomously manage the workflow from `[Backlog]` up to `[In Review]` based on pre-established priorities, deciding which `[To Do]` item to tackle next. The Human Operator's role is primarily the final quality gate: reviewing work in `[In Review]` and deciding whether to move it to `[Done]` or revert it.

---

A feature listed on the project's status tracker can only be transitioned to the **`[Done]`** status by the **Human Operator**. This transition is only permissible when the feature is currently marked as **`[In Review]`** and *all* of the following criteria have been met and verified by the Human Operator:

1.  **Code Generation Complete:** The LLM has generated all necessary code artifacts (e.g., models, views, controllers, services, jobs, configuration, migrations, tests) required to implement the feature as described in the tracker item. **The LLM add meaningful comments \*within the code\* explaining complex logic or design rationale.** **the LLM to write code that *expects* secrets to be provided via environment variables, in ordeer to ensure a secure code.**

2.  **Functionality Implemented:** The generated code achieves the primary functional goal(s) described for the feature. It operates correctly under expected conditions and handles standard inputs as specified or reasonably implied.

3.  **LLM Testing Passed & Verified:** The LLM has successfully executed its own defined test suite(s) for the feature, and consequently moved the status from `[Test]` to `[In Review]`. The Human Operator acknowledges this step was completed by the LLM.

4.  **Code Review Passed:** The Human Operator has reviewed the generated code and deems it acceptable based on:
    *   **Correctness:** The code logically implements the feature requirements.
    *   **Project Standards:** Adherence to established coding conventions, architectural patterns, and style guides (within reasonable expectations for LLM output).
    *   **Maintainability:** The code is sufficiently clear and structured to be understood and modified by a human developer later.
    *   **Security:** No blatant or obvious security vulnerabilities have been introduced.

5.  **Human Functional Verification Passed:** The Human Operator has independently verified that the feature works as intended in the application environment. This may involve:
    *   Manual testing of the user interface or API endpoints.
    *   Executing specific use-case scenarios.
    *   Confirming data is stored and retrieved correctly.
    *   Reviewing the output or side effects of background jobs.

6.  **Integration Verified:** The introduction of the new feature does not negatively impact or break existing, related functionalities (no regressions detected during human verification).

7.  **Logging & Diagnostics (If Applicable):** Sufficient logging (as defined in the project plan/standards) has been implemented by the LLM to aid in monitoring and debugging the feature.

8.  **Documentation Updated (If Necessary):** Any essential comments explaining complex or non-obvious LLM-generated logic have been added, or any required external documentation related to the feature has been created or updated.

---

### Workflow Implied by DoD:

*   **LLM Action (`[Backlog]` -> `[To Do]`):** LLM selects the next highest priority item from `[Backlog]` (based on P0,P1,P2,P3 set priorities) and moves it to `[To Do]`.
*   **LLM Action (`[To Do]` -> `[In Progress]`):** LLM picks an item from `[To Do]` and starts working on it, moving it to `[In Progress]`.
*   **LLM Action (`[In Progress]` -> `[Test]`):** LLM finishes code generation and moves the item to `[Test]`.
*   **LLM Action (`[Test]` -> `[In Progress]`):** If LLM's tests fail, LLM removes `[Test]` tag, returning to `[In Progress]` to fix issues.
*   **LLM Action (`[Test]` -> `[In Review]`):** If LLM's tests pass, LLM adds `[In Review]` tag, and tell the human in the chat to go review the new feature.
*   **Human Action (`[In Review]` -> `[Done]`):** If Human Operator verifies all DoD criteria are met, they add the `[Done]` tag.
*   **Human Action (`[In Review]` -> `[In Progress]`):** If Human Operator finds issues violating the DoD, they remove `[In Review]` and `[Test]` tags (returning it effectively to `[In Progress]`), providing feedback to guide the LLM's next iteration.

This DoD clearly outlines the human's final checklist before accepting the LLM's work, ensuring quality and alignment despite the LLM's autonomy in the earlier stages.