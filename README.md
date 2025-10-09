Plataforma Gamificada de Apoio à Alfabetização para Professores e Terapeutas

TCC — Plataforma gamificada para auxiliar processos de alfabetização e acompanhamento pedagógico/terapêutico.

Visão Geral

Este projeto implementa uma plataforma gamificada voltada ao apoio de professores e terapeutas em atividades de alfabetização.
A proposta é aumentar engajamento e acompanhar a evolução de estudantes por meio de mecânicas de jogo (pontos, níveis, conquistas) e relatórios que facilitam intervenções pedagógicas/terapêuticas.
	•	Stack principal: Java (100%)  ￼
	•	Público-alvo: educadores, terapeutas e estudantes em fase de alfabetização.
	•	Objetivos: engajar, personalizar trilhas, registrar evolução e apoiar decisões com dados.

Como Executar

Ajuste os comandos conforme você estiver usando Maven ou Gradle.

Requisitos
	•	Java 17+ (recomendado) — [ajustar versão]
	•	Maven ou Gradle

Clonar o projeto

```
git clone https://github.com/Gurgelprog123/TCC-Plataforma-Gamificada-de-Apoio-Alfabetiza-o-para-Professores-e-Terapeutas.git
cd TCC-Plataforma-Gamificada-de-Apoio-Alfabetiza-o-para-Professores-e-Terapeutas/tcc
```

Usando Maven

```
# compilar
mvn clean package

# rodar (ajuste a classe principal/jar gerado)
mvn spring-boot:run
# ou:
java -jar target/app.jar

```

Usando Gradle

```
# compilar
./gradlew clean build

# rodar (ajuste a task/classe principal)
./gradlew bootRun
# ou:
java -jar build/libs/app.jar

```

Configuração de ambiente

```properties
# Exemplo (ajuste ao seu projeto)
APP_PORT=8080
DB_URL=jdbc:postgresql://localhost:5432/alfabetizacao
DB_USER=usuario
DB_PASS=senha
````

Testes

```bash

# Maven
mvn test

# Gradle
./gradlew test

```

Contribuição
	1.	Faça um fork do projeto
	2.	Crie sua branch: git checkout -b feature/minha-feature
	3.	Commit: git commit -m "feat: minha feature"
	4.	Push: git push origin feature/minha-feature
	5.	Abra um Pull Request

Autores/Orientação
	•	Autor: Nathan de Olivera Gonçalves
    •	Autor: João Pedro Gurgel Tomaz Farias Fernandes
	•	Orientador(a):  Leticia Toledo Maia Zoby
	•	Instituição/Curso: Iesb - Graduação de Ciência da Computação
	•	Contato: nathanogoncalves.ti@gmail.com / www.linkedin.com/in/nathan-o-goncalves
