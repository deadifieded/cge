# api endpoints

```mermaid
classDiagram
  class HealthCheck {
    +method GET
    +route /health
  }
  class GetUsername {
    +method GET
    +route /username
  }
  class ChangeUsername {
    +method POST
    +route /username/change
  }
  class GetCalendarData {
    +method GET
    +route /calendar/data
  }
  class EditCalendarData {
    +method POST
    +route /calendar/data
  }
```

- [HealthCheck](./HealthCheck.md)
- [GetUsername](./GetUsername.md)
- [ChangeUsername](./ChangeUsername.md)
- [GetCalendarData](./GetCalendarData.md)
- [EditCalendarData](./EditCalendarData.md)
