import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import './DropdownItem.css';

export type DropdownItemData = {
    id: string,
    value?: string,
    inputField?: boolean,
    onConfirm?: (value: string) => void,
};

export type DropdownItemProps = {
    data: DropdownItemData,
    setDropdownDisplayed: Dispatch<SetStateAction<boolean>>,
};

export default function DropdownItem(props: DropdownItemProps) {
    const [value, setValue] = useState(props.data.value ?? '');

    const content = props.data.inputField !== true ? value : (
        <input
            className="dropdown-item-input"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
        />
    );

    useEffect(() => {
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [onKeyDown]);

    return (
        <div className="dropdown-item" onClick={onClick}>
            {content}
        </div>
    );

    function onClick() {
        if (props.data.inputField !== true && props.data.onConfirm !== undefined) {
            props.data.onConfirm(value);
        }
    }

    function onKeyDown(event: KeyboardEvent) {
        if (props.data.inputField === true && event.key === 'Enter') {
            props.setDropdownDisplayed(false);
            setValue('');

            if (props.data.onConfirm !== undefined) {
                props.data.onConfirm(value);
            }
        }
    }
}
