package tcc.agents;

import jade.core.Agent;
import jade.core.behaviours.CyclicBehaviour;
import jade.core.behaviours.OneShotBehaviour;
import jade.lang.acl.ACLMessage;
import jade.lang.acl.MessageTemplate;

public class StudentAgent extends Agent {
    private StudentProfile profile;
    
    // Classe interna para perfil do estudante
    private class StudentProfile {
        String studentId;
        int currentLevel;
        int streakCorrect;
        int streakWrong;
        String preferredModality; // "audio", "visual", "text"
        String fontSize; // "small", "medium", "large"
        boolean subtitles;
        
        public StudentProfile(String id) {
            this.studentId = id;
            this.currentLevel = 1;
            this.streakCorrect = 0;
            this.streakWrong = 0;
            this.preferredModality = "multimodal";
            this.fontSize = "medium";
            this.subtitles = true;
        }
    }
    
    protected void setup() {
        Object[] args = getArguments();
        String studentId = (args != null && args.length > 0) ? (String) args[0] : "default_student";
        
        profile = new StudentProfile(studentId);
        System.out.println("StudentAgent " + getAID().getName() + " criado para: " + studentId);
        
        // Behaviour para consultas de perfil
        addBehaviour(new ProfileQueryBehaviour());
        
        // Behaviour para atualizações de nível
        addBehaviour(new UpdateLevelBehaviour());
        
        // Behaviour para preferências
        addBehaviour(new PreferencesBehaviour());
    }
    
    // Behaviour: Consultas de Perfil
    private class ProfileQueryBehaviour extends CyclicBehaviour {
        public void action() {
            MessageTemplate mt = MessageTemplate.MatchPerformative(ACLMessage.QUERY_IF);
            ACLMessage msg = receive(mt);
            
            if (msg != null) {
                String content = msg.getContent();
                
                if (content.equals("GET_PROFILE")) {
                    ACLMessage reply = msg.createReply();
                    reply.setPerformative(ACLMessage.INFORM);
                    reply.setContent(buildProfileString());
                    send(reply);
                } else if (content.startsWith("GET_PREFERENCE:")) {
                    String preference = content.substring("GET_PREFERENCE:".length());
                    ACLMessage reply = msg.createReply();
                    reply.setPerformative(ACLMessage.INFORM);
                    reply.setContent(getPreference(preference));
                    send(reply);
                }
            } else {
                block();
            }
        }
    }
    
    // Behaviour: Atualizações de Nível e Streaks
    private class UpdateLevelBehaviour extends OneShotBehaviour {
        public void action() {
            MessageTemplate mt = MessageTemplate.MatchPerformative(ACLMessage.INFORM);
            ACLMessage msg = receive(mt);
            
            if (msg != null && msg.getContent().startsWith("UPDATE_STREAK:")) {
                String[] parts = msg.getContent().split(":");
                boolean correct = Boolean.parseBoolean(parts[1]);
                
                // Modificar futuramente para diferentes criterios avaliativos
                if (correct) {
                    profile.streakCorrect++;
                    profile.streakWrong = 0;
                    System.out.println("Streak correto: " + profile.streakCorrect);
                } else {
                    profile.streakWrong++;
                    profile.streakCorrect = 0;
                    System.out.println("Streak errado: " + profile.streakWrong);
                }
                
                // Notificar Adaptation Agent se necessário
                if (profile.streakCorrect >= 3 || profile.streakWrong >= 2) {
                    notifyAdaptationAgent();
                }
            }
        }
    }
    
    // Behaviour: Gerenciar Preferências
    private class PreferencesBehaviour extends CyclicBehaviour {
        public void action() {
            MessageTemplate mt = MessageTemplate.and(
                MessageTemplate.MatchPerformative(ACLMessage.REQUEST),
                MessageTemplate.MatchContent("UPDATE_PREFERENCES")
            );
            ACLMessage msg = receive(mt);
            
            if (msg != null) {
                // Processar atualização de preferências
                updatePreferences(msg.getContent());
                
                ACLMessage reply = msg.createReply();
                reply.setPerformative(ACLMessage.CONFIRM);
                reply.setContent("PREFERENCES_UPDATED");
                send(reply);
            } else {
                block();
            }
        }
    }
    
    private String buildProfileString() {
        return String.format(
            "PROFILE:level=%d,streak_correct=%d,streak_wrong=%d,modality=%s,font=%s,subtitles=%b",
            profile.currentLevel, profile.streakCorrect, profile.streakWrong,
            profile.preferredModality, profile.fontSize, profile.subtitles
        );
    }
    
    private String getPreference(String preference) {
        switch (preference) {
            case "modality": return profile.preferredModality;
            case "fontSize": return profile.fontSize;
            case "subtitles": return String.valueOf(profile.subtitles);
            default: return "unknown";
        }
    }
    
    private void updatePreferences(String content) {
        // Implementar parsing das preferências
        System.out.println("Preferências atualizadas: " + content);
    }
    
    private void notifyAdaptationAgent() {
        ACLMessage msg = new ACLMessage(ACLMessage.INFORM);
        msg.addReceiver(getAID("adaptation"));
        msg.setContent("STREAK_UPDATE:" + buildProfileString());
        send(msg);
    }
    
    protected void takeDown() {
        System.out.println("StudentAgent finalizado.");
    }
}