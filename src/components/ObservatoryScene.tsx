import aboutScene from '../assets/observatory/about-observatory.svg';
import dashboardScene from '../assets/observatory/dashboard-atlas.svg';
import reflectionScene from '../assets/observatory/reflection-horizon.svg';
import shellScene from '../assets/observatory/shell-horizon.svg';
import workflowScene from '../assets/observatory/workflow-chart.svg';

type ObservatorySceneName = 'about' | 'dashboard' | 'reflection' | 'shell' | 'workflow';

type Props = {
  scene: ObservatorySceneName;
  className?: string;
};

const sceneMap: Record<ObservatorySceneName, string> = {
  about: aboutScene,
  dashboard: dashboardScene,
  reflection: reflectionScene,
  shell: shellScene,
  workflow: workflowScene,
};

export function ObservatoryScene({ scene, className = '' }: Props) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={`observatory-scene observatory-scene-${scene} ${className}`.trim()}
      src={sceneMap[scene]}
    />
  );
}
