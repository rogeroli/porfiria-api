# ADR-0001: Usar NestJS como Monólito Modular

## Status
Aceito

## Contexto
A API precisa de separação clara por domínio, enquanto o produto ainda está em estágio inicial e deve evitar a complexidade operacional de serviços distribuídos.

Também existe a decisão de preparar a aplicação para execução em AWS Lambda, usando functions/serverless quando fizer sentido. Para isso, o framework precisa permitir um bootstrap rápido, empacotamento previsível e compatibilidade com execução em ambientes stateless.

## Decisão
A API backend será implementada como um monólito modular usando módulos nativos do NestJS e o adaptador HTTP Fastify. Cada domínio será responsável pelos seus limites de módulo e irá expor comportamento por meio de services públicos ou eventos quando apropriado.

NestJS será utilizado também por oferecer uma base madura para aplicações HTTP e por permitir adaptação futura para AWS Lambda sem abandonar a organização modular do projeto.

## Alternativas Consideradas
- Módulo único e plano: mais simples no início, mas difícil de evoluir com múltiplos domínios.
- Microsserviços desde o início: melhora o deploy independente, mas adiciona complexidade operacional e de comunicação desnecessária para o estágio atual.
- Adaptador Express: comum em projetos NestJS, mas a cadeia atual de dependências introduz alertas evitáveis de auditoria em runtime para esta configuração inicial.
- Framework HTTP minimalista sem arquitetura modular: poderia reduzir ainda mais o bootstrap inicial, mas exigiria criar padrões próprios para módulos, validação, injeção de dependência, testes e documentação.

## Consequências
- Os domínios podem evoluir de forma independente dentro da mesma aplicação implantável.
- A API usa Fastify como adaptador do servidor HTTP.
- A aplicação deve manter bootstrap enxuto para preservar boa inicialização em ambientes serverless.
- Código com estado em memória, conexões persistentes e inicializações pesadas deve ser tratado com cuidado para compatibilidade com AWS Lambda.
- A configuração de deploy para AWS Lambda deverá ser especificada em documento próprio antes da implementação.
- Dependências circulares devem ser evitadas ativamente.
- Uma extração futura para serviços continua possível quando um domínio tiver uma necessidade real de escala ou ownership.

## Especificações Relacionadas
- Nenhuma.
