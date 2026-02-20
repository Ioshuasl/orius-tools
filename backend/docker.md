## Comando para iniciar o conteiner

```
docker run --name orius-db -e POSTGRES_PASSWORD=orius_admin -e POSTGRES_DB=orius_tools -p 5432:5432 -d postgres
```