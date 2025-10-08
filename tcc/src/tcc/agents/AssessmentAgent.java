package tcc.agents;

import jade.core.Agent;
import jade.core.behaviours.CyclicBehaviour;
import jade.lang.acl.ACLMessage;
import jade.lang.acl.MessageTemplate;

public class AssessmentAgent extends Agent {
    
    protected void setup() {
        System.out.println("AssessmentAgent " + getAID().getName() + " está pronto.");
        
        // Behaviour para avaliar tentativas
        addBehaviour(new EvaluateAttemptBehaviour());
        
        // Behaviour para tagging de habilidades
        addBehaviour(new SkillTaggingBehaviour());
    }
    
    // Behaviour: Avaliar Tentativas
    private class EvaluateAttemptBehaviour extends CyclicBehaviour {
        public void action() {
            MessageTemplate mt = MessageTemplate.MatchPerformative(ACLMessage.REQUEST);
            ACLMessage msg = receive(mt);
            
            if (msg != null && msg.getContent().startsWith("ATTEMPT_RESULT")) {
                AttemptResult result = evaluateAttempt(msg.getContent());
                
                // Enviar resultado para Orchestrator
                ACLMessage reply = msg.createReply();
                reply.setPerformative(ACLMessage.INFORM);
                reply.setContent(serializeAssessment(result));
                send(reply);
                
                // Notificar StudentAgent sobre streak
                notifyStudentStreak(result.isCorrect);
            } else {
                block();
            }
        }
    }
    
    // Behaviour: Tagging de Habilidades
    private class SkillTaggingBehaviour extends CyclicBehaviour {
        public void action() {
            MessageTemplate mt = MessageTemplate.MatchPerformative(ACLMessage.INFORM);
            ACLMessage msg = receive(mt);
            
            if (msg != null && msg.getContent().startsWith("TAG_SKILLS")) {
                String[] skillTags = tagSkills(msg.getContent());
                
                ACLMessage reply = msg.createReply();
                reply.setPerformative(ACLMessage.INFORM);
                reply.setContent("SKILLS_TAGGED:" + String.join(",", skillTags));
                send(reply);
            } else {
                block();
            }
        }
    }
    
    private class AttemptResult {
        String attemptId;
        String studentId;
        String activityId;
        boolean isCorrect;
        long responseTime;
        double accuracy;
        String errorType; // "phoneme_confusion", "syllable_error", "rhyme_error"
        String[] skillTags;
        
        public AttemptResult(String attemptId, String studentId, String activityId, 
                           boolean isCorrect, long responseTime) {
            this.attemptId = attemptId;
            this.studentId = studentId;
            this.activityId = activityId;
            this.isCorrect = isCorrect;
            this.responseTime = responseTime;
            this.accuracy = isCorrect ? 1.0 : 0.0;
            this.errorType = identifyErrorType();
            this.skillTags = identifySkillTags();
        }
        
        private String identifyErrorType() {
            // Lógica simplificada para identificar tipo de erro
            if (!isCorrect) {
                return "phoneme_confusion"; // Exemplo
            }
            return "none";
        }
        
        private String[] identifySkillTags() {
            // Identificar habilidades envolvidas na atividade
            return new String[]{"phonological_awareness", "auditory_discrimination"};
        }
    }
    
    private AttemptResult evaluateAttempt(String attemptData) {
        // Parsing dos dados da tentativa
        String[] parts = attemptData.split(":");
        String studentId = parts[1];
        String activityId = parts[2];
        String studentAnswer = parts[3];
        long responseTime = Long.parseLong(parts[4]);
        
        boolean isCorrect = checkAnswer(activityId, studentAnswer);
        
        return new AttemptResult(
            generateAttemptId(), studentId, activityId, isCorrect, responseTime
        );
    }
    
    private boolean checkAnswer(String activityId, String studentAnswer) {
        // Lógica simplificada de correção
        // Na prática, consultaria o ContentAgent para resposta correta
        return studentAnswer != null && !studentAnswer.trim().isEmpty();
    }
    
    private String[] tagSkills(String content) {
        // Lógica para identificar habilidades baseada no conteúdo da atividade
        return new String[]{
            "phonological_awareness", 
            "working_memory", 
            "auditory_processing"
        };
    }
    
    private String serializeAssessment(AttemptResult result) {
        return String.format(
            "ASSESSMENT_RESULT:attempt=%s,student=%s,correct=%b,accuracy=%.2f,time=%d,error=%s",
            result.attemptId, result.studentId, result.isCorrect, 
            result.accuracy, result.responseTime, result.errorType
        );
    }
    
    private void notifyStudentStreak(boolean isCorrect) {
        ACLMessage msg = new ACLMessage(ACLMessage.INFORM);
        msg.addReceiver(getAID("student"));
        msg.setContent("UPDATE_STREAK:" + isCorrect);
        send(msg);
    }
    
    private String generateAttemptId() {
        return "ATTEMPT_" + System.currentTimeMillis();
    }
    
    protected void takeDown() {
        System.out.println("AssessmentAgent finalizado.");
    }
}