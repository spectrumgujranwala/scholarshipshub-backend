const { supabase, bucketName } = require('../config/supabase');

/**
 * Helper to check if a value is a plain object.
 */
const isPlainObject = (val) => {
  return val && typeof val === 'object' && val.constructor === Object;
};

/**
 * Extracts the relative file path from a Supabase URL.
 * Works for both public URLs and signed URLs.
 */
const getPathFromSupabaseUrl = (url) => {
  if (typeof url !== 'string') return null;
  const bucketSegment = `/${bucketName}/`;
  const index = url.indexOf(bucketSegment);
  if (index === -1) return null;
  
  let filePath = url.slice(index + bucketSegment.length);
  const qIndex = filePath.indexOf('?');
  if (qIndex !== -1) {
    filePath = filePath.substring(0, qIndex);
  }
  return decodeURIComponent(filePath);
};

/**
 * Generates a temporary signed URL for a given Supabase storage URL.
 */
const signSupabaseUrl = async (url, expiresIn = 3600) => {
  try {
    if (!url || typeof url !== 'string') return url;
    if (!url.includes('/storage/v1/object/')) return url; // Not a Supabase URL
    
    const filePath = getPathFromSupabaseUrl(url);
    if (!filePath) return url;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error(`Error generating signed URL for ${filePath}:`, error.message);
      return url;
    }
    return data.signedUrl;
  } catch (error) {
    console.error('Error in signSupabaseUrl:', error);
    return url;
  }
};

/**
 * Reverts a signed/authenticated Supabase URL to standard public format.
 */
const unsignSupabaseUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('/storage/v1/object/')) return url;

  let cleanUrl = url.split('?')[0];
  cleanUrl = cleanUrl.replace('/object/sign/', '/object/public/');
  cleanUrl = cleanUrl.replace('/object/authenticated/', '/object/public/');
  return cleanUrl;
};

/**
 * Recursively unsigns all Supabase URLs in an object or array to ensure
 * clean URL strings are saved in the database.
 */
const unsignDocUrls = (obj) => {
  if (!obj) return obj;
  if (typeof obj === 'string') {
    return unsignSupabaseUrl(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => unsignDocUrls(item));
  }
  if (isPlainObject(obj)) {
    const cleaned = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cleaned[key] = unsignDocUrls(obj[key]);
      }
    }
    return cleaned;
  }
  return obj;
};

/**
 * Outbound: Signs all file URLs in an Application object.
 */
const signApplicationUrls = async (application, expiresIn = 3600) => {
  if (!application) return application;
  const app = application.toObject ? application.toObject() : application;

  if (app.applicantInfo) {
    if (app.applicantInfo.photo) {
      app.applicantInfo.photo = await signSupabaseUrl(app.applicantInfo.photo, expiresIn);
    }
  }

  if (app.englishProficiency) {
    if (app.englishProficiency.certificateUrl) {
      app.englishProficiency.certificateUrl = await signSupabaseUrl(app.englishProficiency.certificateUrl, expiresIn);
    }
  }

  if (app.documents) {
    if (app.documents.cv) {
      app.documents.cv = await signSupabaseUrl(app.documents.cv, expiresIn);
    }
    if (app.documents.sop) {
      app.documents.sop = await signSupabaseUrl(app.documents.sop, expiresIn);
    }
    if (app.documents.transcript) {
      app.documents.transcript = await signSupabaseUrl(app.documents.transcript, expiresIn);
    }
    if (app.documents.passport) {
      app.documents.passport = await signSupabaseUrl(app.documents.passport, expiresIn);
    }
    if (app.documents.englishCert) {
      app.documents.englishCert = await signSupabaseUrl(app.documents.englishCert, expiresIn);
    }
    if (Array.isArray(app.documents.others)) {
      app.documents.others = await Promise.all(
        app.documents.others.map(url => signSupabaseUrl(url, expiresIn))
      );
    }
  }

  if (app.declaration) {
    if (app.declaration.signature) {
      app.declaration.signature = await signSupabaseUrl(app.declaration.signature, expiresIn);
    }
  }

  return app;
};

/**
 * Outbound: Signs all attachment URLs in a Remark object.
 */
const signRemarkUrls = async (remark, expiresIn = 3600) => {
  if (!remark) return remark;
  const rem = remark.toObject ? remark.toObject() : remark;

  if (rem.attachmentUrl) {
    rem.attachmentUrl = await signSupabaseUrl(rem.attachmentUrl, expiresIn);
  }

  return rem;
};

module.exports = {
  signSupabaseUrl,
  unsignSupabaseUrl,
  unsignDocUrls,
  signApplicationUrls,
  signRemarkUrls,
};
