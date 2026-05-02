const axios = require('axios');

/**
 * Fetches clinical trials from ClinicalTrials.gov API v2.
 */
async function fetchClinicalTrials(query, disease, location = '', maxResults = 30) {
  try {
    const searchTerm = `${query} ${disease}`.trim();

    const params = {
      'query.term': searchTerm,
      pageSize: maxResults,
      format: 'json',
      countTotal: true,
      fields: [
        'NCTId',
        'BriefTitle',
        'OfficialTitle',
        'OverallStatus',
        'BriefSummary',
        'DetailedDescription',
        'EligibilityCriteria',
        'Gender',
        'MinimumAge',
        'MaximumAge',
        'StdAge',
        'LocationFacility',
        'LocationCity',
        'LocationCountry',
        'LocationState',
        'CentralContactName',
        'CentralContactPhone',
        'CentralContactEMail',
        'StartDate',
        'CompletionDate',
        'PrimaryCompletionDate',
        'Phase',
        'StudyType',
        'EnrollmentCount',
        'Condition',
        'InterventionName',
        'InterventionType',
        'LeadSponsorName',
        'LastUpdatePostDate',
      ].join(','),
    };

    // Add location filter if provided
    if (location && location.trim()) {
      params['query.locn'] = location.trim();
    }

    const res = await axios.get('https://clinicaltrials.gov/api/v2/studies', {
      params,
      timeout: 15000,
    });

    const studies = res.data.studies || [];
    const totalFound = res.data.totalCount || studies.length;
    console.log(`[ClinicalTrials] Found ${totalFound} trials, mapped ${studies.length}`);

    return studies.map(mapStudy).filter((s) => s && s.title);
  } catch (err) {
    console.error('[ClinicalTrials] fetch error:', err.message);
    return [];
  }
}

function mapStudy(study) {
  try {
    const p = study.protocolSection;
    if (!p) return null;

    const id = p.identificationModule;
    const status = p.statusModule;
    const desc = p.descriptionModule;
    const elig = p.eligibilityModule;
    const contacts = p.contactsLocationsModule;
    const design = p.designModule;
    const arms = p.armsInterventionsModule;
    const sponsor = p.sponsorCollaboratorsModule;

    // Locations
    const locations = (contacts?.locations || [])
      .slice(0, 5)
      .map((loc) => [loc.facility, loc.city, loc.state, loc.country].filter(Boolean).join(', '))
      .join('; ');

    // Central contact
    const centralContact = (contacts?.centralContacts || [])[0];
    const contact = centralContact
      ? {
          name: centralContact.name || 'N/A',
          phone: centralContact.phone || '',
          email: centralContact.email || '',
        }
      : { name: 'See trial page', phone: '', email: '' };

    // Interventions
    const interventions = (arms?.interventions || [])
      .slice(0, 3)
      .map((i) => `${i.type || ''}: ${i.name || ''}`.trim())
      .join(', ');

    const nctId = id?.nctId || '';

    return {
      id: nctId,
      title: id?.briefTitle || id?.officialTitle || '',
      officialTitle: id?.officialTitle || '',
      status: status?.overallStatus || 'Unknown',
      phase: (design?.phases || []).join(', ') || 'N/A',
      studyType: design?.studyType || 'N/A',
      enrollment: design?.enrollmentInfo?.count || 'N/A',
      summary: desc?.briefSummary || '',
      eligibility: elig?.eligibilityCriteria || '',
      gender: elig?.sex || 'All',
      minAge: elig?.minimumAge || 'N/A',
      maxAge: elig?.maximumAge || 'N/A',
      locations: locations || 'Multiple / Not specified',
      contact,
      interventions: interventions || 'N/A',
      sponsor: sponsor?.leadSponsor?.name || 'N/A',
      startDate: status?.startDateStruct?.date || 'N/A',
      completionDate: status?.completionDateStruct?.date || status?.primaryCompletionDateStruct?.date || 'N/A',
      lastUpdated: status?.lastUpdatePostDateStruct?.date || '',
      url: `https://clinicaltrials.gov/study/${nctId}`,
      source: 'ClinicalTrials.gov',
    };
  } catch (err) {
    return null;
  }
}

module.exports = { fetchClinicalTrials };