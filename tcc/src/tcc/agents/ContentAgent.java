package tcc.agents;

import jade.core.Agent;
import jade.core.behaviours.CyclicBehaviour;
import jade.core.behaviours.OneShotBehaviour;
import jade.lang.acl.ACLMessage;
import jade.lang.acl.MessageTemplate;
import java.util.*;

public class ContentAgent extends Agent {
    private Map<String, List<ActivitySpec>> activitiesBySkill;
    private Map<String, ActivitySpec> activityCache;
    
    // Classe para especificação de atividades
    private class ActivitySpec {
        String activityId;
        String skill; // "phonological_awareness", "syllables", "rhymes"
        int difficultyLevel;
        String type; // "image-word", "rhyme-matching", "syllable-counting"
        String content; // JSON ou dados da atividade
        List<String> modalities; // ["audio", "visual", "text"]
        
        public ActivitySpec(String id, String skill, int level, String type, String content) {
            this.activityId = id;
            this.skill = skill;
            this.difficultyLevel = level;
            this.type = type;
            this.content = content;
            this.modalities = Arrays.asList("audio", "visual", "text");
        }
    }
    
    protected void setup() {
        System.out.println("ContentAgent " + getAID().getName() + " está pronto.");
        
        initializeActivities();
        activityCache = new HashMap<>();
        
        // Behaviour para recomendar atividades
        addBehaviour(new RecommendActivityBehaviour());
        
        // Behaviour para warmup do cache
        addBehaviour(new CacheWarmupBehaviour());
    }
    
    // Behaviour: Recomendar Atividades
    private class RecommendActivityBehaviour extends CyclicBehaviour {
        public void action() {
            MessageTemplate mt = MessageTemplate.MatchPerformative(ACLMessage.REQUEST);
            ACLMessage msg = receive(mt);
            
            if (msg != null) {
                String content = msg.getContent();
                
                if (content.startsWith("REQUEST_ACTIVITY")) {
                    String studentId = extractStudentId(content);
                    ActivitySpec activity = recommendActivity(studentId);
                    
                    ACLMessage reply = msg.createReply();
                    reply.setPerformative(ACLMessage.INFORM);
                    reply.setContent(serializeActivity(activity));
                    send(reply);
                    
                } else if (content.startsWith("ADAPTED_ACTIVITY")) {
                    // Atividade adaptada baseada na decisão do Adaptation Agent
                    ActivitySpec adaptedActivity = createAdaptedActivity(content);
                    
                    ACLMessage reply = msg.createReply();
                    reply.setPerformative(ACLMessage.INFORM);
                    reply.setContent(serializeActivity(adaptedActivity));
                    send(reply);
                }
            } else {
                block();
            }
        }
    }
    
    // Behaviour: Warmup do Cache
    private class CacheWarmupBehaviour extends OneShotBehaviour {
        public void action() {
            System.out.println("Realizando warmup do cache de atividades...");
            // Pré-carregar atividades mais comuns no cache
            preloadCommonActivities();
        }
    }
    
    private void initializeActivities() {
        activitiesBySkill = new HashMap<>();
        
        // Atividades para consciência fonológica
        List<ActivitySpec> phonologicalActivities = Arrays.asList(
            new ActivitySpec("PHON01", "phonological_awareness", 1, "image-word", 
                "{\"word\": \"casa\", \"image\": \"casa.png\", \"sounds\": [\"ca\", \"sa\"]}"),
            new ActivitySpec("PHON02", "phonological_awareness", 2, "sound-matching",
                "{\"target\": \"bola\", \"options\": [\"bola\", \"cola\", \"sola\"]}")
        );
        activitiesBySkill.put("phonological_awareness", phonologicalActivities);
        
        // Atividades para rimas
        List<ActivitySpec> rhymeActivities = Arrays.asList(
            new ActivitySpec("RHY01", "rhymes", 1, "rhyme-matching",
                "{\"word\": \"gato\", \"rhymes\": [\"pato\", \"rato\", \"prato\"]}"),
            new ActivitySpec("RHY02", "rhymes", 2, "rhyme-identification",
                "{\"words\": [\"sol\", \"mar\", \"farol\"], \"correct\": \"sol-farol\"}")
        );
        activitiesBySkill.put("rhymes", rhymeActivities);
        
        // Atividades para sílabas
        List<ActivitySpec> syllableActivities = Arrays.asList(
            new ActivitySpec("SYL01", "syllables", 1, "syllable-counting",
                "{\"word\": \"banana\", \"syllables\": 3}"),
            new ActivitySpec("SYL02", "syllables", 2, "syllable-segmentation",
                "{\"word\": \"computador\", \"segments\": [\"com\", \"pu\", \"ta\", \"dor\"]}")
        );
        activitiesBySkill.put("syllables", syllableActivities);
    }
    
    private ActivitySpec recommendActivity(String studentId) {
        // Lógica simplificada de recomendação
        // Na prática, consultaria o StudentAgent para preferências e nível
        String targetSkill = "phonological_awareness";
        int targetLevel = 1;
        
        List<ActivitySpec> availableActivities = activitiesBySkill.get(targetSkill);
        if (availableActivities != null && !availableActivities.isEmpty()) {
            // Filtrar por nível e retornar atividade apropriada
            return availableActivities.stream()
                .filter(a -> a.difficultyLevel == targetLevel)
                .findFirst()
                .orElse(availableActivities.get(0));
        }
        
        return createDefaultActivity();
    }
    
    private ActivitySpec createAdaptedActivity(String adaptationDecision) {
        // Implementar lógica de criação de atividade adaptada
        // baseada na decisão do AdaptationAgent
        System.out.println("Criando atividade adaptada: " + adaptationDecision);
        return createDefaultActivity();
    }
    
    private ActivitySpec createDefaultActivity() {
        return new ActivitySpec("DEFAULT", "phonological_awareness", 1, "image-word",
            "{\"word\": \"bola\", \"image\": \"bola.png\", \"sounds\": [\"bo\", \"la\"]}");
    }
    
    private String extractStudentId(String content) {
        // Extrair studentId do conteúdo da mensagem
        return content.contains("student=") ? 
            content.split("student=")[1] : "default_student";
    }
    
    private String serializeActivity(ActivitySpec activity) {
        return String.format(
            "ACTIVITY:id=%s,skill=%s,level=%d,type=%s,content=%s",
            activity.activityId, activity.skill, activity.difficultyLevel,
            activity.type, activity.content
        );
    }
    
    private void preloadCommonActivities() {
        // Pré-carregar atividades comuns no cache
        activityCache.put("default_activity", createDefaultActivity());
    }
    
    protected void takeDown() {
        System.out.println("📚 ContentAgent finalizado.");
    }
}