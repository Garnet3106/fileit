import { variables as leftPanelVariables } from '../LeftPane/LeftPane';
import ContentPane from './ContentPane/ContentPane';
import DetailBar from './DetailBar/DetailBar';
import OperationPane from './OperationPane/OperationPane';
import TabPane from './TabPane/TabPane';
import './MainPanel.css';

export const variables = {
    width: `calc(100vw - ${leftPanelVariables.width + 1}px)`,
};

export default function MainPanel() {
    const containerBorderWidth = 1;

    const styles = {
        container: {
            borderLeftWidth: `${containerBorderWidth}px`,
            width: variables.width,
        },
    };

    return (
        <div className="main-panel-container" style={styles.container}>
            <TabPane />
            <OperationPane />
            <ContentPane />
            <DetailBar />
        </div>
    );
}
