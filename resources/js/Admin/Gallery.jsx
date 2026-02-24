import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import GalleryRest from '../Actions/Admin/GalleryRest';
import slugify from '../Utils/slugify';

const galleryRest = new GalleryRest()

const Gallery = ({ images: imagesJSON = [] }) => {

  const [images, setImages] = useState(imagesJSON.map(x => {
    x.uuid = crypto.randomUUID()
    return x
  }));

  useEffect(() => {
    $(".image-popup").magnificPopup({
      type: "image",
      closeOnContentClick: !0,
      mainClass: "mfp-fade",
      gallery: {
        enabled: !0,
        navigateByImgClick: !0,
        preload: [0, 1]
      }
    })
  }, [null])

  const onImageChange = async (e) => {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    e.target.value = null
    const name = e.target.name

    const formData = new FormData();
    formData.append('image', file)
    formData.append('name', name)

    const result = await galleryRest.save(formData)
    if (!result) return
    setImages(old => {
      return old.map(x => {
        if (x.src == name) x.uuid = crypto.randomUUID()
        return x
      })
    })
  }

  return (<div className='port'>
    <div className="row portfolioContainer">
      {images.map((image, index) => {
        const slug = slugify(image.name)
        return <div key={index} className="col-xl-3 col-lg-4 col-md-6 natural personal">
          <div className="gal-detail thumb">
            <div style={{ position: 'relative' }}>
              <img src={`/assets/resources/${image.src}?v=${image.uuid}`} className="thumb-img img-fluid"
                alt="work-thumbnail" onError={e => e.target.src = '/assets/resources/cover-404.svg'} style={{
                  aspectRatio: image.aspect,
                  objectFit: image.fit,
                  objectPosition: 'center',
                  width: '100%'
                }} />
              <div className='d-flex px-2 py-1 justify-content-center gap-1' style={{
                backgroundColor: 'rgba(0, 0, 0, .25)',
                position: 'absolute',
                bottom: 0,
                width: '100%',
                borderRadius: '0 0 3px 3px'
              }}>
                <a href={`/assets/resources/${image.src}`} className="btn btn-xs btn-primary image-popup" title={image.name}>
                  <i className='mdi mdi-eye me-1'></i>
                  Abrir
                </a>
                <input type="file" name={image.src} id={`image-${slug}`} onChange={onImageChange} hidden accept='image/*' />
                <label htmlFor={`image-${slug}`} className='btn btn-xs btn-dark'>
                  <i className='mdi mdi-image-edit me-1'></i>
                  Cambiar
                </label>
              </div>
            </div>

            <div className="text-center">
              <h4>{image.name}</h4>
              <p className="font-13 text-muted mb-2">{image.description}</p>
            </div>
          </div>
        </div>
      })}
    </div>
  </div>)
}

CreateReactScript((el, properties) => {

  createRoot(el).render(<BaseAdminto {...properties} title='Galeria'>
    <Gallery {...properties} />
  </BaseAdminto>);
})