import diff from "fast-diff";

export function textUpdate(handle, YText, newValue, oldValue, initPosition) {
    const selections = {
        oldRange: {
            index: initPosition - Math.max(0, newValue.length - oldValue.length),
            length: Math.max(0, oldValue.length - newValue.length),
        },
        newRange: { index: initPosition, length: 0 },
    };

    const changes = diff(oldValue, newValue, selections);

    let position = 0;

    for (const [type, substring] of changes) {
        switch (type) {
            case diff.EQUAL:
                position += substring.length;
                break;
            case diff.DELETE:
                YText.delete(position, substring.length);
                break;
            case diff.INSERT:
                YText.insert(position, substring);
                position += substring.length;
                break;
        }
    }

    return 
}