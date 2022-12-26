import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { EventHandlerLayer, events, PropagationStopper } from '../../../../common/event';
import './DropdownItem.css';

export type DropdownItemData = {
    id: string,
    value?: string,
    inputField?: boolean,
    onConfirm?: (id: string, value: string) => void,
};

export type DropdownItemProps = {
    data: DropdownItemData,
    dropdownDisplayedState: [boolean, Dispatch<SetStateAction<boolean>>],
};

export default function DropdownItem(props: DropdownItemProps) {
    useEffect(() => {
        if (props.data.inputField !== true && props.data.value === undefined) {
            console.warn('No value specified into text field.');
        }
    }, []);

    const [dropdownDisplayed, setDropdownDisplayed] = props.dropdownDisplayedState;
    const [value, setValue] = useState(props.data.value ?? '');

    const content = props.data.inputField !== true ? (
        <div className="dropdown-item-text">
            {value}
        </div>
    ) : (
        <input
            className="dropdown-item-input"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
        />
    );

    useEffect(() => {
        events.keyDown.addHandler(onKeyDown, EventHandlerLayer.KeyDownLayer.DropdownItem);
        events.mouseDown.addHandler(onMouseDown);

        return () => {
            events.keyDown.removeHandler(onKeyDown, EventHandlerLayer.KeyDownLayer.DropdownItem);
            events.mouseDown.removeHandler(onMouseDown);
        };
    }, [onKeyDown, onMouseDown]);

    return (
        <div className="dropdown-item" onClick={onClick}>
            {content}
        </div>
    );

    function onClick() {
        if (props.data.inputField !== true && props.data.onConfirm !== undefined) {
            props.data.onConfirm(props.data.id, value);
            closeDropdown();
        }
    }

    function onKeyDown(event: KeyboardEvent, stopPropagation: PropagationStopper) {
        if (props.data.inputField === true && dropdownDisplayed) {
            switch (event.code) {
                case 'Escape':
                stopPropagation();
                closeDropdown(true);
                break;

                case 'Enter':
                stopPropagation();
                closeDropdown(true);

                if (props.data.onConfirm !== undefined) {
                    props.data.onConfirm(props.data.id, value);
                }

                break;
            }
        }
    }

    function onMouseDown(event: MouseEvent) {
        const target = event.target as HTMLElement;

        if (dropdownDisplayed) {
            switch (target.className) {
                case 'dropdown-item':
                case 'dropdown-item-input':
                break;

                default:
                closeDropdown(props.data.inputField === true);
                break;
            }
        }
    }

    function closeDropdown(initializeValue?: boolean) {
        setDropdownDisplayed(false);

        if (initializeValue === true) {
            setValue('');
        }
    }
}
