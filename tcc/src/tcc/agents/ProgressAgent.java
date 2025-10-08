package tcc.agents;

import jade.core.Agent;
import jade.core.behaviours.CyclicBehaviour;
import jade.core.behaviours.TickerBehaviour;
import jade.lang.acl.ACLMessage;
import jade.lang.acl.MessageTemplate;
import java.io.*;
import java.util.*;

public class ProgressAgent extends Agent {
    private LocalStorage storage;
    private SyncScheduler syncScheduler;
    private boolean isOnline = true; // Simulação
    
    protected void setup() {
        System.out.println("ProgressAgent " + getAID().getName() + " está pronto.");
        
        storage = new LocalStorage();
        syncScheduler = new SyncScheduler();
        
        // Behaviour para armazenamento local
        addBehaviour(new LocalStoreBehaviour());
        
        // Behaviour para agendamento de sync
        addBehaviour(new SyncSchedulerBehaviour(this, 30000)); // 30 segundos
        
        // Behaviour para resolução de conflitos
        addBehaviour(new ConflictResolverBehaviour());
    }
    
    // Behaviour: Armazenamento Local
    private class LocalStoreBehaviour extends CyclicBehaviour {
        public void action() {
            MessageTemplate mt = MessageTemplate.MatchPerformative(ACLMessage.REQUEST);
            ACLMessage msg = receive(mt);
            
            if (msg != null) {
                String content = msg.getContent();
                
                if (content.startsWith("STORE_ATTEMPT")) {
                    boolean success = storage.storeAttempt(content);
                    
                    ACLMessage reply = msg.createReply();
                    reply.setPerformative(success ? ACLMessage.CONFIRM : ACLMessage.DISCONFIRM);
                    reply.setContent(success ? "ATTEMPT_STORED" : "STORAGE_ERROR");
                    send(reply);
                    
                } else if (content.startsWith("RETRIEVE_PROGRESS")) {
                    String progressData = storage.retrieveProgress(content);
                    
                    ACLMessage reply = msg.createReply();
                    reply.setPerformative(ACLMessage.INFORM);
                    reply.setContent(progressData);
                    send(reply);
                }
            } else {
                block();
            }
        }
    }
    
    // Behaviour: Agendamento de Sync
    private class SyncSchedulerBehaviour extends TickerBehaviour {
        public SyncSchedulerBehaviour(Agent a, long period) {
            super(a, period);
        }
        
        protected void onTick() {
            if (isOnline && storage.hasPendingSync()) {
                System.out.println("Executando sync agendado...");
                performSync();
            }
        }
    }
    
    // Behaviour: Resolução de Conflitos
    private class ConflictResolverBehaviour extends CyclicBehaviour {
        public void action() {
            MessageTemplate mt = MessageTemplate.MatchPerformative(ACLMessage.INFORM);
            ACLMessage msg = receive(mt);
            
            if (msg != null && msg.getContent().startsWith("CONFLICT_DETECTED")) {
                String resolution = resolveConflict(msg.getContent());
                
                ACLMessage reply = msg.createReply();
                reply.setPerformative(ACLMessage.INFORM);
                reply.setContent("CONFLICT_RESOLVED:" + resolution);
                send(reply);
            } else {
                block();
            }
        }
    }
    
    // Sistema de Armazenamento Local
    private class LocalStorage {
        private Map<String, List<String>> attemptStorage;
        private final String STORAGE_FILE = "progress_data.txt";
        
        public LocalStorage() {
            attemptStorage = new HashMap<>();
            loadFromFile();
        }
        
        public boolean storeAttempt(String attemptData) {
            try {
                String studentId = extractStudentId(attemptData);
                attemptStorage.computeIfAbsent(studentId, k -> new ArrayList<>()).add(attemptData);
                
                saveToFile();
                return true;
            } catch (Exception e) {
                System.err.println("Erro ao armazenar tentativa: " + e.getMessage());
                return false;
            }
        }
        
        public String retrieveProgress(String query) {
            String studentId = extractStudentId(query);
            List<String> attempts = attemptStorage.getOrDefault(studentId, new ArrayList<>());
            
            return String.format("PROGRESS_DATA:student=%s,attempts=%d,data=%s",
                studentId, attempts.size(), String.join(";", attempts));
        }
        
        public boolean hasPendingSync() {
            return !attemptStorage.isEmpty();
        }
        
        private void saveToFile() {
            try (PrintWriter out = new PrintWriter(new FileWriter(STORAGE_FILE))) {
                for (Map.Entry<String, List<String>> entry : attemptStorage.entrySet()) {
                    out.println("STUDENT:" + entry.getKey());
                    for (String attempt : entry.getValue()) {
                        out.println("ATTEMPT:" + attempt);
                    }
                }
            } catch (IOException e) {
                System.err.println("Erro ao salvar arquivo: " + e.getMessage());
            }
        }
        
        private void loadFromFile() {
            File file = new File(STORAGE_FILE);
            if (file.exists()) {
                try (BufferedReader br = new BufferedReader(new FileReader(file))) {
                    String line;
                    String currentStudent = null;
                    
                    while ((line = br.readLine()) != null) {
                        if (line.startsWith("STUDENT:")) {
                            currentStudent = line.substring("STUDENT:".length());
                        } else if (line.startsWith("ATTEMPT:") && currentStudent != null) {
                            String attempt = line.substring("ATTEMPT:".length());
                            attemptStorage.computeIfAbsent(currentStudent, k -> new ArrayList<>()).add(attempt);
                        }
                    }
                } catch (IOException e) {
                    System.err.println("Erro ao carregar arquivo: " + e.getMessage());
                }
            }
        }
    }
    
    // Agendador de Sincronização
    private class SyncScheduler {
        public void scheduleSync() {
            System.out.println("Sync agendado para próxima conexão");
        }
    }
    
    private String extractStudentId(String data) {
        // Extrair studentId dos dados
        if (data.contains("student=")) {
            return data.split("student=")[1].split(",")[0];
        }
        return "unknown_student";
    }
    
    private void performSync() {
        System.out.println("Sincronizando dados com servidor...");
        // Implementar lógica de sincronização com servidor central
    }
    
    private String resolveConflict(String conflictData) {
        System.out.println("Resolvendo conflito: " + conflictData);
        // Lógica de resolução de conflitos (timestamp mais recente vence)
        return "RESOLVED_BY_TIMESTAMP";
    }
    
    protected void takeDown() {
        System.out.println("ProgressAgent finalizado.");
        storage.saveToFile();
    }
}