import Number2Currency from "../../../Utils/Number2Currency";

const OriginsChart = ({ origins, totalOutcomeAds }) => {
    const adOrigins = origins.filter(item => item.is_advertising === 1);
    const organicOrigins = origins.filter(item => item.is_advertising === 0);

    const totalAds = adOrigins.reduce((acc, item) => Number(acc) + Number(item.amount), 0)
    const totalOrganic = organicOrigins.reduce((acc, item) => Number(acc) + Number(item.amount), 0)

    return (<div className="table-responsive">
        <table className="table table-sm table-bordered mb-0">
            <thead className="table-light">
                <tr>
                    <th>Tipo</th>
                    <th>Categoría</th>
                    <th>Ventas</th>
                    <th>Monto</th>
                </tr>
            </thead>
            <tbody>
                {adOrigins.length > 0 && <tr>
                    <td rowSpan={adOrigins.length}>
                        Publicidad
                        <small className="d-block text-muted">
                            S/ {Number2Currency(totalAds)}
                        </small>
                        <small>
                            <b>ROAS: </b>
                            {(totalAds / Math.abs(totalOutcomeAds || 1)).toFixed(2)}
                        </small>
                    </td>
                    <td>{adOrigins[0].name}</td>
                    <td className="text-center">{adOrigins[0].total_count}</td>
                    <td className="text-end">S/ {Number2Currency(adOrigins[0].amount)}</td>
                </tr>}
                {adOrigins.slice(1).map((item, index) => (
                    <tr key={index}>
                        <td>{item.name}</td>
                        <td className="text-center">{item.total_count}</td>
                        <td className="text-end">S/ {Number2Currency(item.amount)}</td>
                    </tr>
                ))}
                {organicOrigins.length > 0 && <tr>
                    <td rowSpan={organicOrigins.length}>
                        Orgánico
                        <small className="d-block text-muted">
                            S/ {Number2Currency(totalOrganic)}
                        </small>
                    </td>
                    <td>{organicOrigins[0].name}</td>
                    <td className="text-center">{organicOrigins[0].total_count}</td>
                    <td className="text-end">S/ {Number2Currency(organicOrigins[0].amount)}</td>
                </tr>}
                {organicOrigins.slice(1).map((item, index) => (
                    <tr key={index}>
                        <td>{item.name}</td>
                        <td className="text-center">{item.total_count}</td>
                        <td className="text-end">S/ {Number2Currency(item.amount)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>);
};

export default OriginsChart;
