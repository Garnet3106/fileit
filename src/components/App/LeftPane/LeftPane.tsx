import { variables as tabPaneVariables } from '../MainPanel/TabPane/TabPane';
import { preferences } from '../../../common/preferences';
import './LeftPane.css';
import LeftPaneGroup from './LeftPaneGroup/LeftPaneGroup';
import { ItemPath } from '../../../common/fs/path';

export const variables = {
    width: 150,
};

export default function LeftPane() {
    const styles = {
        top: {
            borderColor: preferences.appearance.border1,
            height: tabPaneVariables.height,
        },
    };

    return (
        <div className="left-pane-container" style={{
            backgroundColor: preferences.appearance.background.panel1,
            width: variables.width,
        }}>
            <div className="left-pane-top" style={styles.top}>
                FileMe
            </div>
            <LeftPaneGroup items={[
                {
                    path: new ItemPath('C', [], true),
                },
            ]} />
        </div>
    );
}
