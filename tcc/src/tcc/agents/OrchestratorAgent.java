package tcc.agents;

import jade.core.Agent;
import jade.core.behaviours.CyclicBehaviour;
import jade.core.behaviours.OneShotBehaviour;
import jade.core.behaviours.TickerBehaviour;
import jade.lang.acl.ACLMessage;
import jade.lang.acl.MessageTemplate;

public class OrchestratorAgent extends Agent {
    private boolean sessionActive = false;
    private String currentStudent;
    
    protected void setup() {
        System.out.println("OrchestratorAgent " + getAID().getName() + " está pronto.");
        
        // Behaviour para iniciar sessão
        addBehaviour(new SessionStartBehaviour());
        
        // Behaviour para rotear requisições
        addBehaviour(new RouteRequestBehaviour());
        
        // Behaviour de heartbeat (verifica se agents estão ativos)
        addBehaviour(new HeartbeatBehaviour(this, 10000)); // 10 segundos
    }
    
    // Behaviour: Iniciar/Encerrar Sessão
    private class SessionStartBehaviour extends OneShotBehaviour {
        public void action() {
            ACLMessage msg = receive(MessageTemplate.MatchPerformative(ACLMessage.REQUEST));
            if (msg != null && msg.getContent().startsWith("START_SESSION")) {
                sessionActive = true;
                currentStudent = msg.getSender().getLocalName();
                System.out.println("Sessão iniciada para: " + currentStudent);
                
                // Solicitar primeira atividade
                requestActivity();
            }
        }
    }
    
    // Behaviour: Roteamento de Mensagens
    private class RouteRequestBehaviour extends CyclicBehaviour {
        public void action() {
            MessageTemplate mt = MessageTemplate.MatchPerformative(ACLMessage.INFORM);
            ACLMessage msg = receive(mt);
            
            if (msg != null) {
                String content = msg.getContent();
                
                if (content.startsWith("ATTEMPT_RESULT")) {
                    // Encaminhar para Assessment Agent
                    forwardToAssessmentAgent(content);
                } else if (content.startsWith("ASSESSMENT_RESULT")) {
                    // Encaminhar para Adaptation Agent
                    forwardToAdaptationAgent(content);
                } else if (content.startsWith("ADAPTATION_DECISION")) {
                    // Solicitar nova atividade baseada na decisão
                    requestAdaptedActivity(content);
                }
            } else {
                block();
            }
        }
    }
    
    // Behaviour: Heartbeat
    private class HeartbeatBehaviour extends TickerBehaviour {
        public HeartbeatBehaviour(Agent a, long period) {
            super(a, period);
        }
        
        protected void onTick() {
            if (sessionActive) {
                System.out.println("Sessão ativa para: " + currentStudent);
                // Verificar se todos os agents essenciais estão respondendo
            }
        }
    }
    
    private void requestActivity() {
        ACLMessage msg = new ACLMessage(ACLMessage.REQUEST);
        msg.addReceiver(getAID("content"));
        msg.setContent("REQUEST_ACTIVITY:student=" + currentStudent);
        send(msg);
        System.out.println("Solicitando atividade para: " + currentStudent);
    }
    
    private void forwardToAssessmentAgent(String content) {
        ACLMessage msg = new ACLMessage(ACLMessage.REQUEST);
        msg.addReceiver(getAID("assessment"));
        msg.setContent(content);
        send(msg);
    }
    
    private void forwardToAdaptationAgent(String content) {
        ACLMessage msg = new ACLMessage(ACLMessage.REQUEST);
        msg.addReceiver(getAID("adaptation"));
        msg.setContent(content);
        send(msg);
    }
    
    private void requestAdaptedActivity(String adaptationDecision) {
        ACLMessage msg = new ACLMessage(ACLMessage.REQUEST);
        msg.addReceiver(getAID("content"));
        msg.setContent("ADAPTED_ACTIVITY:" + adaptationDecision);
        send(msg);
    }
    
    protected void takeDown() {
        System.out.println("OrchestratorAgent finalizado.");
    }
}