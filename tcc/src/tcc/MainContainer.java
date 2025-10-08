package tcc;

import jade.core.Profile;
import jade.core.ProfileImpl;
import jade.core.Runtime;
import jade.wrapper.AgentContainer;
import jade.wrapper.AgentController;
import jade.wrapper.StaleProxyException;

public class MainContainer {
    public static void main(String[] args) {
        Runtime rt = Runtime.instance();
        Profile p = new ProfileImpl();
        p.setParameter(Profile.MAIN_HOST, "localhost");
        p.setParameter(Profile.MAIN_PORT, "8080");
        p.setParameter(Profile.GUI, "true");
        
        AgentContainer mainContainer = rt.createMainContainer(p);
        
        try {
            // Iniciar Orchestrator Agent
            AgentController orchestrator = mainContainer.createNewAgent(
                "orchestrator", "tcc.agents.OrchestratorAgent", null);
            orchestrator.start();
            
            // Iniciar Student Agent
            AgentController student = mainContainer.createNewAgent(
                "student", "tcc.agents.StudentAgent", null);
            student.start();
            
            // Iniciar Content Agent
            AgentController content = mainContainer.createNewAgent(
                "content", "tcc.agents.ContentAgent", null);
            content.start();
            
            // Iniciar Assessment Agent
            AgentController assessment = mainContainer.createNewAgent(
                "assessment", "tcc.agents.AssessmentAgent", null);
            assessment.start();
            
            // Iniciar Adaptation Agent
            AgentController adaptation = mainContainer.createNewAgent(
                "adaptation", "tcc.agents.AdaptationAgent", null);
            adaptation.start();
            
            // Iniciar Progress Agent
            AgentController progress = mainContainer.createNewAgent(
                "progress", "tcc.agents.ProgressAgent", null);
            progress.start();
            
            System.out.println("Todos os agents especializados foram iniciados!");
            
        } catch (StaleProxyException e) {
            e.printStackTrace();
        }
    }
}