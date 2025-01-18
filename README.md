## Documentação

### URL base
`https://robot-genesis-face-recognition-api.nyr4mj.easypanel.host`

### Endpoints

`GET /`

Verifica se o serviço está funcionando. Retorna apenas o texto "EXECUTANDO!".

`POST /reference`

Recebe um arquivo de imagem como anexo, envia para o **Minio** e armazena sua URL no **Redis**, com o identificador especificado.

```mermaid
graph LR
A("POST /reference")
A --> B("Gera link do Minio")
B --> C("Registra o link no Redis")
```

**Body params (multipart-form)**
identifier: *string*
file: *File*

`POST /compare`

Recebe um arquivo de imagem como anexo, envia para o **Minio**, baixa as duas imagens e as compara, respondendo com o valor da similaridade e oo resultado do *match*.

```mermaid
graph LR
A("POST /compare")
A --> B("Gera link do Minio")
B --> C("Armazena os links no RabbitMQ")
C --> D("Consome a msg")
D --> E("Salva o resultado no Redis")
E --> F("Exclui o resultado após alguns segundos")
```

**Body params (multipart-form)**
identifier: *string*
file: *File*