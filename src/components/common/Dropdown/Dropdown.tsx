import DropdownItem, { DropdownItemData } from "./DropdownItem/DropdownItem";
import './Dropdown.css';
import { ForwardedRef, forwardRef, useImperativeHandle, useState } from "react";

export type DropdownProps = {
    pivot: [number, number],
    items: DropdownItemData[],
};

export type DropdownRef = {
    switchVisibility: () => void,
};

function Dropdown(props: DropdownProps, ref: ForwardedRef<DropdownRef>) {
    const [displayed, setDisplayed] = useState(false);

    useImperativeHandle(ref, () => ({
        switchVisibility: () => setDisplayed(() => !displayed),
    }));

    const styles = {
        container: {
            display: displayed ? 'flex' : 'none',
            top: props.pivot[1],
            left: props.pivot[0],
        },
    };

    const itemElems = props.items.map((eachItem) => (
        <DropdownItem data={eachItem} dropdownDisplayedState={[displayed, setDisplayed]} key={eachItem.id} />
    ));

    return (
        <div className="dropdown" style={styles.container}>
            {itemElems}
        </div>
    );
}

export default forwardRef(Dropdown);
