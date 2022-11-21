import { useSelector } from 'react-redux';
import { RootState } from '../../../common/redux';
import { variables as detailBarVariables } from '../MainPanel/DetailBar/DetailBar';
import PopupItem from './PopupItem/PopupItem';
import './PopupList.css';

export default function PopupList() {
    const popups = useSelector((state: RootState) => state.popups);
    const popupElements: JSX.Element[] = [];
    popups.forEach((eachPopup, uuid) => popupElements.push(<PopupItem uuid={uuid} data={eachPopup} key={uuid} />));

    const styles = {
        container: {
            bottom: 15 + detailBarVariables.height,
            right: 15,
        },
    };

    return (
        <div className="popup-list" style={styles.container}>
            {popupElements}
        </div>
    );
}
