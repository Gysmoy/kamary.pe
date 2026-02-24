import convertTo12h from "./convertTo12h";

const buildSchedule = (hours) => {
    if (!hours) return 'Horario no disponible';

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const labels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const groups = [];

    let i = 0;
    while (i < days.length) {
        const d = days[i];
        const h = hours[d];
        if (!h) { i++; continue; }

        const start = i;
        while (
            i + 1 < days.length &&
            hours[days[i + 1]] &&
            hours[days[i + 1]].open === h.open &&
            hours[days[i + 1]].close === h.close
        ) i++;

        const end = i;
        const range = start === end
            ? labels[start]
            : `${labels[start]} a ${labels[end]}`;
        const open12 = convertTo12h(h.open);
        const close12 = convertTo12h(h.close);
        groups.push(`${range}: ${open12} - ${close12}`);
        i++;
    }
    return groups.join(' | ');
};

export default buildSchedule