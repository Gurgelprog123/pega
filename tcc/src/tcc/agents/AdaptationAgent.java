package tcc.agents;

import jade.core.Agent;
import jade.core.behaviours.CyclicBehaviour;
import jade.lang.acl.ACLMessage;
import jade.lang.acl.MessageTemplate;

public class AdaptationAgent extends Agent {
    private AdaptationRuleEngine ruleEngine;
    
    protected void setup() {
        System.out.println("AdaptationAgent " + getAID().getName() + " está pronto.");
        
        ruleEngine = new AdaptationRuleEngine();
        
        // Behaviour para atualizar dificuldade
        addBehaviour(new UpdateDifficultyBehaviour());
        
        // Behaviour para escolher próxima habilidade
        addBehaviour(new ChooseNextSkillBehaviour());
    }
    
    // Behaviour: Atualizar Dificuldade
    private class UpdateDifficultyBehaviour extends CyclicBehaviour {
        public void action() {
            MessageTemplate mt = MessageTemplate.MatchPerformative(ACLMessage.INFORM);
            ACLMessage msg = receive(mt);
            
            if (msg != null) {
                String content = msg.getContent();
                
                if (content.startsWith("ASSESSMENT_RESULT")) {
                    AdaptationDecision decision = ruleEngine.evaluateAssessment(content);
                    
                    ACLMessage reply = msg.createReply();
                    reply.setPerformative(ACLMessage.INFORM);
                    reply.setContent(serializeDecision(decision));
                    send(reply);
                    
                } else if (content.startsWith("STREAK_UPDATE")) {
                    AdaptationDecision decision = ruleEngine.evaluateStreak(content);
                    
                    ACLMessage reply = msg.createReply();
                    reply.setPerformative(ACLMessage.INFORM);
                    reply.setContent(serializeDecision(decision));
                    send(reply);
                }
            } else {
                block();
            }
        }
    }
    
    // Behaviour: Escolher Próxima Habilidade
    private class ChooseNextSkillBehaviour extends CyclicBehaviour {
        public void action() {
            MessageTemplate mt = MessageTemplate.MatchPerformative(ACLMessage.QUERY_IF);
            ACLMessage msg = receive(mt);
            
            if (msg != null && msg.getContent().equals("NEXT_SKILL")) {
                String nextSkill = chooseNextSkill();
                
                ACLMessage reply = msg.createReply();
                reply.setPerformative(ACLMessage.INFORM);
                reply.setContent("NEXT_SKILL:" + nextSkill);
                send(reply);
            } else {
                block();
            }
        }
    }
    
    // Motor de Regras de Adaptação
    private class AdaptationRuleEngine {
        public AdaptationDecision evaluateAssessment(String assessmentData) {
            // Parsing dos dados de avaliação
            String[] parts = assessmentData.split(",");
            double accuracy = Double.parseDouble(parts[3].split("=")[1]);
            String errorType = parts[5].split("=")[1];
            
            // Regra 1: Acurácia baixa → reforço multimodal
            if (accuracy < 0.6) {
                return new AdaptationDecision(
                    "REINFORCEMENT", 
                    "multimodal_support", 
                    "Acurácia abaixo de 60% - ativar suporte multimodal"
                );
            }
            
            // Regra 2: Erro específico → intervenção direcionada
            if (!errorType.equals("none")) {
                return new AdaptationDecision(
                    "INTERVENTION",
                    "targeted_" + errorType,
                    "Intervenção para erro: " + errorType
                );
            }
            
            return new AdaptationDecision("MAINTAIN", "current", "Manter nível atual");
        }
        
        public AdaptationDecision evaluateStreak(String streakData) {
            // Parsing dos dados de streak
            String[] parts = streakData.split(",");
            int streakCorrect = Integer.parseInt(parts[2].split("=")[1]);
            int streakWrong = Integer.parseInt(parts[3].split("=")[1]);
            
            // Regra 3: 3 acertos seguidos → aumentar dificuldade
            if (streakCorrect >= 3) {
                return new AdaptationDecision(
                    "INCREASE", 
                    "level_up", 
                    "3 acertos consecutivos - aumentar nível"
                );
            }
            
            // Regra 4: 2 erros seguidos → diminuir dificuldade
            if (streakWrong >= 2) {
                return new AdaptationDecision(
                    "DECREASE",
                    "level_down",
                    "2 erros consecutivos - diminuir nível"
                );
            }
            
            return new AdaptationDecision("MAINTAIN", "current", "Manter streak atual");
        }
    }
    
    private class AdaptationDecision {
        String action; // "INCREASE", "DECREASE", "MAINTAIN", "REINFORCEMENT"
        String type;
        String reason;
        
        public AdaptationDecision(String action, String type, String reason) {
            this.action = action;
            this.type = type;
            this.reason = reason;
        }
    }
    
    private String chooseNextSkill() {
        // Lógica simplificada para escolha de próxima habilidade
        // Na prática, usaria histórico e currículo sequencial
        String[] skills = {"phonological_awareness", "syllables", "rhymes"};
        return skills[(int) (Math.random() * skills.length)];
    }
    
    private String serializeDecision(AdaptationDecision decision) {
        return String.format(
            "ADAPTATION_DECISION:action=%s,type=%s,reason=%s",
            decision.action, decision.type, decision.reason
        );
    }
    
    protected void takeDown() {
        System.out.println("AdaptationAgent finalizado.");
    }
}