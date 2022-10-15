import { preferences } from '../../../common/preferences';
import ItemMenu from './ItemMenu/ItemMenu';
import './LeftPanel.css';

export const variables = {
    width: 150,
};

export default function LeftPanel() {
    return (
        <div className="left-panel-container" style={{
            backgroundColor: preferences.appearance.background.panel1,
            width: variables.width,
        }}>
            <ItemMenu />
        </div>
    );
}
