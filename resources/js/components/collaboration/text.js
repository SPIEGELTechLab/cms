import diff from "fast-diff";

export function textUpdate(YText, newValue, oldValue, position) {
    const selections = {
        oldRange: {
            index: position - Math.max(0, newValue.length - oldValue.length),
            length: Math.max(0, oldValue.length - newValue.length),
        },
        newRange: { index: position, length: 0 },
    };

    const changes = diff(oldValue, newValue, selections);

    let pos = 0;

    for (const [type, substring] of changes) {
        switch (type) {
            case diff.EQUAL:
                pos += substring.length;
                break;
            case diff.DELETE:
                YText.delete(pos, substring.length);
                break;
            case diff.INSERT:
                YText.insert(pos, substring);
                pos += substring.length;
                break;
        }
    }

    return 
}