import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { slices } from '../../../../common/redux';
import { generateUuid } from '../../../../common/utils';
import './PopupItem.css';
import PopupOperationButton, { PopupOperationButtonData } from './PopupOperationButton/PopupOperationButton';

export type PopupItemData = {
    title: string,
    description: string,
    buttons?: PopupOperationButtonData[],
};

export type PopupItemProps = {
    uuid: string,
    data: PopupItemData,
};

export const variables = {
    closeTimeout: 3000,
};

export default function PopupItem(props: PopupItemProps) {
    const dispatch = useDispatch();
    const buttonElements = props.data.buttons?.map((eachButton) => <PopupOperationButton data={eachButton} key={generateUuid()} />);

    useEffect(() => {
        setTimeout(close, variables.closeTimeout);
    }, []);

    return (
        <div className="popup-item">
            <div className="popup-item-top">
                <div className="popup-item-title">
                    {props.data.title}
                </div>
                <div className="popup-item-close" onClick={onClickCloseIcon} />
            </div>
            <div className="popup-item-description">
                {props.data.description}
            </div>
            <div>
                {buttonElements}
            </div>
        </div>
    );

    function onClickCloseIcon() {
        close();
    }

    function close() {
        dispatch(slices.popups.actions.remove(props.uuid));
    }
}
