# Planora Route/API Migration

## Breaking contract changes in this source package

1. Developer workspace route: `/member/developer/tasks` -> `/member/developer/tickets`
2. Assigned-work API: `/api/tickets/my-tasks` -> `/api/tickets/my-tickets`
3. Assigned-work API: `/api/tickets/my-tasks/all` -> `/api/tickets/my-tickets/all`
4. Assigned-work API: `/api/tickets/my-tasks/resolved` -> `/api/tickets/my-tickets/resolved`
5. Ticket security scheme API: `/api/issue-security-schemes` -> `/api/ticket-security-schemes`
6. Developer dashboard response fields: `myTasks` -> `myTickets`, `pendingTasks` -> `pendingTickets`

The database table `issue_security_schemes` and existing `issue_security.*` authorities are intentionally retained to avoid an unplanned database/permission migration. Java domain classes are renamed to `TicketSecurityScheme*` while preserving those persistence/security contracts.

Old route/API aliases are intentionally not retained because this package was requested as a coordinated breaking rename. Update any external clients, bookmarks, tests, API documentation, and integrations accordingly.
