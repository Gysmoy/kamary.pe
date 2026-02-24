const UserFormulaInfo = ({ name, formula, details, setSelectedFormula }) => {
  const details2process = details?.filter(detail => !detail.user_formula_id || detail.user_formula_id == formula.id)
  return <>
    {
      formula &&
      <>
        <div>
          <b>🧐 Tratamiento</b>:{' '}
          {formula?.has_treatment?.description}
        </div>
        <div>
          <b>👀 Cuero cabelludo</b>: {' '}
          {formula?.scalp_type?.description}
        </div>
        <div>
          <b>✅ Tipo de cabello</b>:{' '}
          {formula?.hair_type?.description}
        </div>
        {
          formula?.hair_thickness &&
          <div>
            <b>💪 Grosor del cabello</b>:{' '}
            {formula?.hair_thickness?.description}
          </div>
        }
        <div>
          <b>💡 Objetivos</b>:{' '}
          <ul className='mb-0'>
            {
              formula?.hair_goals_list?.map(x => <li key={x.id}>{x.description}</li>)
            }
          </ul>
        </div>
        <div>
          <b>🫙 Fragancia</b>:{' '}
          {formula?.fragrance?.name}
        </div>
      </>
    }
    <div>
      <b>🎨 Colores:</b>
      <ul>
        {
          details2process?.map((detail, index) => <li key={index}>
            {detail.name}{
              detail?.colors?.length > 0 && <>: {
                detail?.colors?.map(color => color.name).join(', ')
              }</>
            }
          </li>)
        }
      </ul>
    </div>
    <div className="d-flex gap-1">
      <button className='btn btn-xs btn-dark' type='button' copy={`${formula ? `*Formula ${name}*\n\n🧐 Tratamiento: ${formula?.has_treatment?.description}\n👀 Cuero cabelludo: ${formula?.scalp_type?.description}\n✅ Tipo de cabello: ${formula?.hair_type?.description}\n${formula?.hair_thickness ? `💪 Grosor del cabello: ${formula?.hair_thickness?.description}\n` : ''}💡 Objetivos:\n${formula?.hair_goals_list?.map(x => `- ${x.description}`).join('\n')}\n🫙 Fragancia: ${formula?.fragrance?.name}\n` : `*Pedido ${name}*\n\n`}🎨 Colores:\n${details2process?.map(detail => `- ${detail.name}${detail?.colors?.length > 0 ? `: ${detail?.colors?.map(color => color.name).join(', ')}` : ''}`).join('\n')}`}>
        <i className='mdi mdi-content-copy me-1'></i>
        Copiar
      </button>
      {
        setSelectedFormula &&
        <button className="btn btn-xs btn-primary" type="button" onClick={() => setSelectedFormula({
          id: formula?.id,
          email: formula?.email,
          has_treatment: formula?.has_treatment?.id,
          scalp_type: formula?.scalp_type?.id,
          hair_type: formula?.hair_type?.id,
          hair_thickness: formula?.hair_thickness?.id,
          hair_goals: formula?.hair_goals_list?.map(x => x.id),
          fragrance: formula?.fragrance?.id,
        })}>
          <i className='mdi mdi-pencil me-1'></i>
          Editar
        </button>
      }
    </div>
  </>
}

export default UserFormulaInfo