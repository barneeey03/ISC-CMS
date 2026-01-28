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
  try {
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
  } catch (error) {
    console.error("Error generating CV:", error);
    throw error;
  }
}

/**
 * Generate ISC format CV (used by ISC and other principals without custom templates)
 */
async function generateISCFormatCV(
  crew: CrewMember,
  principal: Principal
): Promise<Blob> {
  // Import docx library dynamically
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

  // Helper to create info table
  const createInfoTable = (data: string[][]) => {
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
  };

  // Helper to create certificates section
  const createCertificatesSection = () => {
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
  };

  // Helper to create vessel experience section
  const createVesselExperienceSection = () => {
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
  };

  // Helper to create education section
  const createEducationSection = () => {
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
  };

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
          ...createCertificatesSection(),

          // Vessel Experience Section
          new Paragraph({
            text: "SEA SERVICE EXPERIENCE",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          ...createVesselExperienceSection(),

          // Education Section
          new Paragraph({
            text: "EDUCATION",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          ...createEducationSection(),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

/**
 * Generate Skeiron format CV (Excel-based)
 * Creates CV from scratch without relying on templates
 */
async function generateSkieronCV(crew: CrewMember): Promise<Blob> {
  try {
    // Import ExcelJS dynamically
    const ExcelJS = (await import("exceljs")).default;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Crew Application Form");

    // Set column widths
    worksheet.columns = [
      { width: 5 },
      { width: 25 },
      { width: 30 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
    ];

    // Title
    worksheet.mergeCells("A1:G1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "SKEIRON CREW APPLICATION FORM";
    titleCell.font = { size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF002060" },
    };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getRow(1).height = 30;

    // Add spacing
    worksheet.addRow([]);

    // Personal Information Header
    let currentRow = 3;
    worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
    const sectionHeader = worksheet.getCell(`A${currentRow}`);
    sectionHeader.value = "PERSONAL INFORMATION";
    sectionHeader.font = { size: 12, bold: true };
    sectionHeader.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9E1F2" },
    };
    currentRow++;

    // Personal Information
    const personalInfo = [
      ["Position Applied:", crew.presentRank || ""],
      ["Full Name:", crew.fullName || ""],
      ["Nationality:", crew.nationality || ""],
      ["Date of Birth:", crew.dateOfBirth || ""],
      ["Place of Birth:", crew.placeOfBirth || ""],
      ["Height (cm):", crew.height?.toString() || ""],
      ["Weight (kg):", crew.weight?.toString() || ""],
      ["Email Address:", crew.emailAddress || ""],
      ["Mobile Number:", crew.mobileNumber || ""],
      ["Marital Status:", crew.maritalStatus || ""],
      ["Nearest Airport:", crew.nearestAirport || ""],
    ];

    personalInfo.forEach(([label, value]) => {
      worksheet.getCell(`B${currentRow}`).value = label;
      worksheet.getCell(`B${currentRow}`).font = { bold: true };
      worksheet.getCell(`C${currentRow}`).value = value;
      currentRow++;
    });

    // Add spacing
    currentRow++;

    // Vessel Experience Header
    worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
    const vesselHeader = worksheet.getCell(`A${currentRow}`);
    vesselHeader.value = "SEA SERVICE EXPERIENCE";
    vesselHeader.font = { size: 12, bold: true };
    vesselHeader.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9E1F2" },
    };
    currentRow++;

    // Vessel Experience Table Headers
    const headers = ["Vessel Name", "Type", "Rank", "Principal", "Sign On", "Sign Off"];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(currentRow, index + 2);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE7E6E6" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    currentRow++;

    // Vessel Experience Data
    const vessels = crew.vesselExperience || [];
    vessels.forEach((vessel) => {
      const data = [
        vessel.vesselName || "",
        vessel.vesselType || "",
        vessel.rank || "",
        vessel.principal || "",
        vessel.signedOn || "",
        vessel.signedOff || "",
      ];
      
      data.forEach((value, index) => {
        const cell = worksheet.getCell(currentRow, index + 2);
        cell.value = value;
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      currentRow++;
    });

    // Add spacing
    currentRow += 2;

    // Certificates Header
    worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
    const certHeader = worksheet.getCell(`A${currentRow}`);
    certHeader.value = "CERTIFICATES & LICENSES";
    certHeader.font = { size: 12, bold: true };
    certHeader.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9E1F2" },
    };
    currentRow++;

    // Certificate Table Headers
    const certHeaders = ["Certificate Name", "Number", "Issue Date", "Expiry Date"];
    certHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(currentRow, index + 2);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE7E6E6" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    currentRow++;

    // Certificate Data
    const certificates = crew.certificates || [];
    certificates.forEach((cert) => {
      const data = [
        cert.certificateName || "",
        cert.certificateNumber || "",
        cert.dateOfIssue || "",
        cert.dateOfExpiry || "",
      ];
      
      data.forEach((value, index) => {
        const cell = worksheet.getCell(currentRow, index + 2);
        cell.value = value;
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  } catch (error) {
    console.error("Error generating Skeiron CV:", error);
    // Fallback to Word format if Excel generation fails
    return generateISCFormatCV(crew, "Skeiron");
  }
}

/**
 * Generate Vallianz format CV (Excel-based)
 * Creates CV from scratch without relying on templates
 */
async function generateVallianzCV(crew: CrewMember): Promise<Blob> {
  try {
    // Import ExcelJS dynamically
    const ExcelJS = (await import("exceljs")).default;

    const workbook = new ExcelJS.Workbook();
    
    // Personal Information Sheet
    const personalSheet = workbook.addWorksheet("PERSONAL INFORMATION");
    personalSheet.columns = [
      { width: 5 },
      { width: 30 },
      { width: 35 },
    ];

    // Title
    personalSheet.mergeCells("A1:C1");
    const titleCell = personalSheet.getCell("A1");
    titleCell.value = "VALLIANZ - CREW APPLICANT CV";
    titleCell.font = { size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF002060" },
    };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    personalSheet.getRow(1).height = 30;

    personalSheet.addRow([]);
    personalSheet.addRow([]);

    // Personal Information
    const personalInfo = [
      ["Full Name:", crew.fullName || ""],
      ["Date of Birth:", crew.dateOfBirth || ""],
      ["Place of Birth:", crew.placeOfBirth || ""],
      ["Nationality:", crew.nationality || ""],
      ["Marital Status:", crew.maritalStatus || ""],
      ["Height (cm):", crew.height?.toString() || ""],
      ["Weight (kg):", crew.weight?.toString() || ""],
      ["Email Address:", crew.emailAddress || ""],
      ["Mobile Number:", crew.mobileNumber || ""],
      ["Position Applied:", crew.presentRank || ""],
    ];

    let row = 4;
    personalInfo.forEach(([label, value]) => {
      personalSheet.getCell(`B${row}`).value = label;
      personalSheet.getCell(`B${row}`).font = { bold: true };
      personalSheet.getCell(`C${row}`).value = value;
      row++;
    });

    // Sea Service Sheet
    const seaServiceSheet = workbook.addWorksheet("SEA SERVICE");
    seaServiceSheet.columns = [
      { width: 5 },
      { width: 20 },
      { width: 15 },
      { width: 15 },
      { width: 25 },
      { width: 12 },
      { width: 12 },
    ];

    // Title
    seaServiceSheet.mergeCells("A1:G1");
    const ssTitle = seaServiceSheet.getCell("A1");
    ssTitle.value = "SEA SERVICE EXPERIENCE";
    ssTitle.font = { size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    ssTitle.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF002060" },
    };
    ssTitle.alignment = { vertical: "middle", horizontal: "center" };
    seaServiceSheet.getRow(1).height = 25;

    seaServiceSheet.addRow([]);
    seaServiceSheet.addRow([]);

    // Headers
    const headers = ["Vessel Name", "Type", "Rank", "Principal", "Sign On", "Sign Off"];
    headers.forEach((header, index) => {
      const cell = seaServiceSheet.getCell(4, index + 2);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9E1F2" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Data
    const vessels = crew.vesselExperience || [];
    vessels.forEach((vessel, vIndex) => {
      const rowNum = 5 + vIndex;
      const data = [
        vessel.vesselName || "",
        vessel.vesselType || "",
        vessel.rank || "",
        vessel.principal || "",
        vessel.signedOn || "",
        vessel.signedOff || "",
      ];
      
      data.forEach((value, index) => {
        const cell = seaServiceSheet.getCell(rowNum, index + 2);
        cell.value = value;
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  } catch (error) {
    console.error("Error generating Vallianz CV:", error);
    // Fallback to Word format if Excel generation fails
    return generateISCFormatCV(crew, "Vallianz");
  }
}

/**
 * Generate Dynamic Marine Services format CV (Word-based)
 */
async function generateDynamicCV(crew: CrewMember): Promise<Blob> {
  // For now, use ISC format
  // TODO: Implement proper template loading and replacement
  return generateISCFormatCV(crew, "Dynamic Marine Services");
}