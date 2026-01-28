import { CrewMember } from "./type";

type Principal =
  | "Skeiron"
  | "LMJ Ship Management LLC"
  | "Grand Asian Shipping Lines"
  | "ISC"
  | "Guangzhou Huayang Maritime Co., LTD."
  | "Vallianz"
  | "Dynamic Marine Services"
  | "Molyneux Marine"
  | "Nixin"
  | "Trawind";

/**
 * Generate a CV for a crew member based on the selected principal
 * @param crew - The crew member data
 * @param principal - The principal to generate the CV for
 * @returns A Blob containing the generated CV
 */
export async function generateCrewCV(
  crew: CrewMember,
  principal: Principal
): Promise<Blob> {
  switch (principal) {
    case "Skeiron":
      return await generateSkieronCV(crew);
    case "Vallianz":
      return await generateVallianzCV(crew);
    case "Dynamic Marine Services":
      return await generateDynamicCV(crew);
    case "ISC":
    case "LMJ Ship Management LLC":
    case "Grand Asian Shipping Lines":
    case "Guangzhou Huayang Maritime Co., LTD.":
    case "Molyneux Marine":
    case "Nixin":
    case "Trawind":
      return await generateISCFormatCV(crew, principal);
    default:
      throw new Error(`Unknown principal: ${principal}`);
  }
}

/**
 * Generate ISC format CV (used by ISC and other principals without custom templates)
 */
async function generateISCFormatCV(
  crew: CrewMember,
  principal: Principal
): Promise<Blob> {
  // Import docx library dynamically to avoid build-time errors
  const docx = await import("docx");
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    HeadingLevel,
    AlignmentType,
    WidthType,
    BorderStyle,
  } = docx;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 12240, // 8.5 inches
              height: 15840, // 11 inches
            },
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // Header with principal name
          new Paragraph({
            text: `CURRICULUM VITAE - ${principal}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Personal Information Section
          new Paragraph({
            text: "PERSONAL INFORMATION",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 },
          }),

          createInfoTable([
            ["Full Name:", crew.fullName || ""],
            ["Date of Birth:", crew.dateOfBirth || ""],
            ["Place of Birth:", crew.placeOfBirth || ""],
            ["Nationality:", crew.nationality || ""],
            ["Marital Status:", crew.maritalStatus || ""],
            ["Height (cm):", crew.height?.toString() || ""],
            ["Weight (kg):", crew.weight?.toString() || ""],
            ["Overall Size:", crew.overallSize || ""],
            ["Shoe Size:", crew.shoeSize || ""],
            ["Email:", crew.emailAddress || ""],
            ["Mobile Number:", crew.mobileNumber || ""],
            ["Nearest Airport:", crew.nearestAirport || ""],
          ]),

          // Present Rank
          new Paragraph({
            text: "POSITION APPLIED FOR",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: crew.presentRank || "",
            spacing: { after: 200 },
          }),

          // Certificates Section
          new Paragraph({
            text: "CERTIFICATES & LICENSES",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          ...createCertificatesSection(crew),

          // Vessel Experience Section
          new Paragraph({
            text: "SEA SERVICE EXPERIENCE",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          ...createVesselExperienceSection(crew),

          // Education Section
          new Paragraph({
            text: "EDUCATION",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          ...createEducationSection(crew),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  // Convert Buffer to Uint8Array for Blob compatibility
  return new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

/**
 * Generate Skeiron format CV (Excel-based)
 */
async function generateSkieronCV(crew: CrewMember): Promise<Blob> {
  // Import ExcelJS dynamically
  const ExcelJS = (await import("exceljs")).default;

  // Load the Skeiron template
  const response = await fetch("/templates/SKEIRON_NEW_CV_FORM.xlsx");
  const arrayBuffer = await response.arrayBuffer();

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.getWorksheet("Crew Application Form");

  if (worksheet) {
    // Fill in the crew data
    // NOTE: You need to verify these cell addresses against your actual template
    // Open the template in Excel to find the correct cells
    
    // Example mappings - ADJUST THESE BASED ON YOUR TEMPLATE
    worksheet.getCell("C4").value = crew.presentRank || "";
    worksheet.getCell("C5").value = crew.fullName || "";
    worksheet.getCell("C6").value = crew.nationality || "";
    worksheet.getCell("C7").value = crew.dateOfBirth || "";
    worksheet.getCell("C8").value = crew.placeOfBirth || "";
    worksheet.getCell("C9").value = crew.height || "";
    worksheet.getCell("C10").value = crew.weight || "";
    worksheet.getCell("C11").value = crew.emailAddress || "";
    worksheet.getCell("C12").value = crew.mobileNumber || "";
    worksheet.getCell("C13").value = crew.maritalStatus || "";
    worksheet.getCell("C14").value = crew.nearestAirport || "";

    // Fill vessel experience starting at a specific row
    const vessels = crew.vesselExperience || [];
    const vesselStartRow = 20; // Adjust this based on your template

    vessels.forEach((vessel, index) => {
      const row = vesselStartRow + index;
      worksheet.getCell(`B${row}`).value = vessel.vesselName || "";
      worksheet.getCell(`C${row}`).value = vessel.vesselType || "";
      worksheet.getCell(`D${row}`).value = vessel.rank || "";
      worksheet.getCell(`E${row}`).value = vessel.principal || "";
      worksheet.getCell(`F${row}`).value = vessel.signedOn || "";
      worksheet.getCell(`G${row}`).value = vessel.signedOff || "";
    });

    // Fill certificates if needed
    const certificates = crew.certificates || [];
    const certStartRow = 50; // Adjust based on template

    certificates.forEach((cert, index) => {
      const row = certStartRow + index;
      worksheet.getCell(`B${row}`).value = cert.certificateName || "";
      worksheet.getCell(`C${row}`).value = cert.certificateNumber || "";
      worksheet.getCell(`D${row}`).value = cert.dateOfIssue || "";
      worksheet.getCell(`E${row}`).value = cert.dateOfExpiry || "";
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  // Convert Buffer to Uint8Array for Blob compatibility
  return new Blob([new Uint8Array(buffer as unknown as Buffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Generate Vallianz format CV (Excel-based)
 */
async function generateVallianzCV(crew: CrewMember): Promise<Blob> {
  // Import ExcelJS dynamically
  const ExcelJS = (await import("exceljs")).default;

  // Load the Vallianz template
  const response = await fetch("/templates/VALLIANZ_APPLICANT_CV.xlsx");
  const arrayBuffer = await response.arrayBuffer();

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const personalInfoSheet = workbook.getWorksheet("PERSONAL INFORMATION");
  const seaServiceSheet = workbook.getWorksheet("SEA SERVICE");

  if (personalInfoSheet) {
    // Fill in personal information
    // NOTE: Verify these cell addresses against your template
    personalInfoSheet.getCell("C5").value = crew.fullName || "";
    personalInfoSheet.getCell("C6").value = crew.dateOfBirth || "";
    personalInfoSheet.getCell("C7").value = crew.placeOfBirth || "";
    personalInfoSheet.getCell("C8").value = crew.nationality || "";
    personalInfoSheet.getCell("C9").value = crew.maritalStatus || "";
    personalInfoSheet.getCell("C10").value = crew.height || "";
    personalInfoSheet.getCell("C11").value = crew.weight || "";
    personalInfoSheet.getCell("C12").value = crew.emailAddress || "";
    personalInfoSheet.getCell("C13").value = crew.mobileNumber || "";
    personalInfoSheet.getCell("C14").value = crew.presentRank || "";
  }

  if (seaServiceSheet) {
    // Fill in sea service data
    const vessels = crew.vesselExperience || [];
    const startRow = 5; // Adjust based on template

    vessels.forEach((vessel, index) => {
      const row = startRow + index;
      seaServiceSheet.getCell(`B${row}`).value = vessel.vesselName || "";
      seaServiceSheet.getCell(`C${row}`).value = vessel.vesselType || "";
      seaServiceSheet.getCell(`D${row}`).value = vessel.rank || "";
      seaServiceSheet.getCell(`E${row}`).value = vessel.principal || "";
      seaServiceSheet.getCell(`F${row}`).value = vessel.signedOn || "";
      seaServiceSheet.getCell(`G${row}`).value = vessel.signedOff || "";
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  // Convert Buffer to Uint8Array for Blob compatibility
  return new Blob([new Uint8Array(buffer as unknown as Buffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Generate Dynamic Marine Services format CV (Word-based)
 */
async function generateDynamicCV(crew: CrewMember): Promise<Blob> {
  // For now, use ISC format
  // TODO: Implement proper template loading and replacement
  return generateISCFormatCV(crew, "Dynamic Marine Services");
}

// Helper functions

function createInfoTable(data: string[][]): any {
  // Import will be available from the parent function's scope
  const docx = require("docx");
  const { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, BorderStyle } = docx;

  const border = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: "CCCCCC",
  };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [3000, 6000],
    rows: data.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              borders: { top: border, bottom: border, left: border, right: border },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: label, bold: true })],
                }),
              ],
            }),
            new TableCell({
              borders: { top: border, bottom: border, left: border, right: border },
              children: [new Paragraph({ children: [new TextRun(value)] })],
            }),
          ],
        })
    ),
  });
}

function createCertificatesSection(crew: CrewMember): any[] {
  const docx = require("docx");
  const { Paragraph, TextRun } = docx;

  const certificates = crew.certificates || [];

  if (certificates.length === 0) {
    return [
      new Paragraph({
        children: [new TextRun("No certificates recorded")],
        spacing: { after: 200 },
      }),
    ];
  }

  return certificates.map(
    (cert) =>
      new Paragraph({
        children: [
          new TextRun({
            text: `• ${cert.certificateName || ""} - ${cert.certificateNumber || ""} (Issued: ${
              cert.dateOfIssue || ""
            }, Expires: ${cert.dateOfExpiry || ""})`,
          }),
        ],
        spacing: { after: 100 },
      })
  );
}

function createVesselExperienceSection(crew: CrewMember): any[] {
  const docx = require("docx");
  const { Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle } = docx;

  const vessels = crew.vesselExperience || [];

  if (vessels.length === 0) {
    return [
      new Paragraph({
        children: [new TextRun("No vessel experience recorded")],
        spacing: { after: 200 },
      }),
    ];
  }

  const border = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: "CCCCCC",
  };

  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // Header row
        new TableRow({
          children: [
            "Vessel Name",
            "Type",
            "Rank",
            "Principal",
            "Sign On",
            "Sign Off",
          ].map(
            (header) =>
              new TableCell({
                borders: { top: border, bottom: border, left: border, right: border },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: header, bold: true })],
                  }),
                ],
              })
          ),
        }),
        // Data rows
        ...vessels.map(
          (vessel) =>
            new TableRow({
              children: [
                vessel.vesselName || "",
                vessel.vesselType || "",
                vessel.rank || "",
                vessel.principal || "",
                vessel.signedOn || "",
                vessel.signedOff || "",
              ].map(
                (value) =>
                  new TableCell({
                    borders: { top: border, bottom: border, left: border, right: border },
                    children: [new Paragraph({ children: [new TextRun(value)] })],
                  })
              ),
            })
        ),
      ],
    }),
  ];
}

function createEducationSection(crew: CrewMember): any[] {
  const docx = require("docx");
  const { Paragraph, TextRun } = docx;

  const education = crew.education || [];

  if (education.length === 0) {
    return [
      new Paragraph({
        children: [new TextRun("No education records")],
        spacing: { after: 200 },
      }),
    ];
  }

  return education.map(
    (edu: any) =>
      new Paragraph({
        children: [
          new TextRun({
            text: `• ${edu.institutionName || ""} - ${edu.courseTitle || ""} (${
              edu.fromDate || ""
            } to ${edu.toDate || ""})`,
          }),
        ],
        spacing: { after: 100 },
      })
  );
}