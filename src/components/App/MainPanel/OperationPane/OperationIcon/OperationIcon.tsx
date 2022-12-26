import { MouseEvent } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../common/redux';
import './OperationIcon.css';

export type OperationIconProps = {
    id: string,
    mini?: boolean,
    preventClick?: boolean,
    onClick?: (event: MouseEvent) => void,
};

export default function OperationIcon(props: OperationIconProps) {
    const miniClassName = props.mini === true ? 'operation-icon-container-mini' : '';
    const appearanceTheme = useSelector((state: RootState) => state.preferences.appearance.theme);

    const styles = {
        container: {
            backgroundImage: `url('./lib/img/icons/${appearanceTheme}/operations/${props.id}.svg')`,
            opacity: props.preventClick === true ? 0.5 : 1,
        },
    };

    return (
        <div
            className={`operation-icon-container ${miniClassName}`}
            style={styles.container}
            onClick={props.onClick}
        />
    );
}
