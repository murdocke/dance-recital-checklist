"use client";

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { ChangeEvent, FormEvent, useState } from "react";

type ChecklistRow = {
  id: string;
  studentName: string;
  routine: string;
  costume: string;
  paid: boolean;
  quickChange: boolean;
};

function buildChecklistRows(studentCount: number, routineCount: number): ChecklistRow[] {
  return Array.from({ length: studentCount }, (_, studentIndex) => {
    const studentNumber = studentIndex + 1;

    return Array.from({ length: routineCount }, (_, routineIndex) => {
      const routineNumber = routineIndex + 1;

      return {
        id: `student-${studentNumber}-routine-${routineNumber}`,
        studentName: `Student ${studentNumber}`,
        routine: `Routine ${routineNumber}`,
        costume: `Costume ${routineNumber}`,
        paid: false,
        quickChange: false
      };
    });
  }).flat();
}

function sanitizeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function HomePage() {
  const feedbackFormUrl =
    "https://docs.google.com/forms/d/e/1FAIpQLSci-9ibEimHqm5naAzeDbVeSmDbM1BvGg79bRWnjxLPb9VvUQ/viewform?usp=publish-editor";
  const [studioName, setStudioName] = useState("");
  const [studentCount, setStudentCount] = useState("12");
  const [routineCount, setRoutineCount] = useState("3");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [checklistRows, setChecklistRows] = useState<ChecklistRow[]>([]);
  const [submitted, setSubmitted] = useState<{
    studioName: string;
    studentCount: number;
    routineCount: number;
  } | null>(null);

  function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedStudentCount = Number(studentCount);
    const parsedRoutineCount = Number(routineCount);

    if (
      !studioName.trim() ||
      !Number.isInteger(parsedStudentCount) ||
      !Number.isInteger(parsedRoutineCount) ||
      parsedStudentCount < 1 ||
      parsedRoutineCount < 1
    ) {
      return;
    }

    setSubmitted({
      studioName: studioName.trim(),
      studentCount: parsedStudentCount,
      routineCount: parsedRoutineCount
    });
    setChecklistRows(buildChecklistRows(parsedStudentCount, parsedRoutineCount));
  }

  function handleRowFieldChange(
    rowId: string,
    field: "studentName" | "routine" | "costume",
    event: ChangeEvent<HTMLInputElement>
  ) {
    const nextValue = event.target.value;

    setChecklistRows((currentRows) =>
      currentRows.map((row) => (row.id === rowId ? { ...row, [field]: nextValue } : row))
    );
  }

  function handleRowToggle(rowId: string, field: "paid" | "quickChange") {
    setChecklistRows((currentRows) =>
      currentRows.map((row) => (row.id === rowId ? { ...row, [field]: !row[field] } : row))
    );
  }

  async function handleDownloadPdf() {
    if (!submitted || checklistRows.length === 0) {
      return;
    }

    setIsGeneratingPdf(true);

    try {
      const pdfDoc = await PDFDocument.create();
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pageWidth = 792;
      const pageHeight = 612;
      const margin = 40;
      const rowHeight = 24;
      const headerHeight = 32;
      const tableTop = pageHeight - 116;
      const tableWidth = pageWidth - margin * 2;
      const columns = [
        { label: "Student Name", width: 140 },
        { label: "Routine", width: 120 },
        { label: "Costume", width: 120 },
        { label: "Paid", width: 58 },
        { label: "Quick Change", width: 96 },
        { label: "Notes", width: tableWidth - 140 - 120 - 120 - 58 - 96 }
      ];
      const rowsPerPage = Math.floor((tableTop - margin - headerHeight) / rowHeight);
      const pageCount = Math.ceil(checklistRows.length / rowsPerPage);

      for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const rows = checklistRows.slice(pageIndex * rowsPerPage, (pageIndex + 1) * rowsPerPage);

        page.drawText(submitted.studioName, {
          x: margin,
          y: pageHeight - 54,
          size: 24,
          font: boldFont,
          color: rgb(0.12, 0.11, 0.1)
        });

        page.drawText(
          `Recital Checklist  |  ${submitted.studentCount} students  |  ${submitted.routineCount} routines each`,
          {
            x: margin,
            y: pageHeight - 76,
            size: 10,
            font: regularFont,
            color: rgb(0.4, 0.36, 0.32)
          }
        );

        page.drawText(`Page ${pageIndex + 1} of ${pageCount}`, {
          x: pageWidth - margin - 58,
          y: pageHeight - 76,
          size: 10,
          font: regularFont,
          color: rgb(0.4, 0.36, 0.32)
        });

        page.drawRectangle({
          x: margin,
          y: tableTop,
          width: tableWidth,
          height: headerHeight,
          color: rgb(0.95, 0.89, 0.82),
          borderColor: rgb(0.84, 0.78, 0.71),
          borderWidth: 1
        });

        let xCursor = margin;
        columns.forEach((column) => {
          page.drawText(column.label, {
            x: xCursor + 8,
            y: tableTop + 11,
            size: 10,
            font: boldFont,
            color: rgb(0.22, 0.18, 0.14)
          });

          page.drawLine({
            start: { x: xCursor, y: tableTop },
            end: { x: xCursor, y: tableTop - headerHeight - rows.length * rowHeight },
            thickness: 1,
            color: rgb(0.84, 0.78, 0.71)
          });

          xCursor += column.width;
        });

        page.drawLine({
          start: { x: margin + tableWidth, y: tableTop },
          end: { x: margin + tableWidth, y: tableTop - headerHeight - rows.length * rowHeight },
          thickness: 1,
          color: rgb(0.84, 0.78, 0.71)
        });

        rows.forEach((row, rowIndex) => {
          const y = tableTop - headerHeight - rowIndex * rowHeight;

          page.drawRectangle({
            x: margin,
            y: y - rowHeight,
            width: tableWidth,
            height: rowHeight,
            color: rowIndex % 2 === 0 ? rgb(1, 0.99, 0.97) : rgb(0.99, 0.97, 0.93),
            borderColor: rgb(0.88, 0.83, 0.76),
            borderWidth: 1
          });

          page.drawText(row.studentName, {
            x: margin + 8,
            y: y - 16,
            size: 9.5,
            font: regularFont,
            color: rgb(0.12, 0.11, 0.1)
          });

          page.drawText(row.routine, {
            x: margin + columns[0].width + 8,
            y: y - 16,
            size: 9.5,
            font: regularFont,
            color: rgb(0.12, 0.11, 0.1)
          });

          page.drawText(row.costume, {
            x: margin + columns[0].width + columns[1].width + 8,
            y: y - 16,
            size: 9.5,
            font: regularFont,
            color: rgb(0.12, 0.11, 0.1)
          });

          const paidCheckboxX =
            margin + columns[0].width + columns[1].width + columns[2].width + 22;
          page.drawRectangle({
            x: paidCheckboxX,
            y: y - 18,
            width: 12,
            height: 12,
            borderColor: rgb(0.45, 0.39, 0.34),
            borderWidth: 1
          });
          if (row.paid) {
            page.drawLine({
              start: { x: paidCheckboxX + 2, y: y - 16 },
              end: { x: paidCheckboxX + 10, y: y - 8 },
              thickness: 1.2,
              color: rgb(0.45, 0.2, 0.14)
            });
            page.drawLine({
              start: { x: paidCheckboxX + 10, y: y - 16 },
              end: { x: paidCheckboxX + 2, y: y - 8 },
              thickness: 1.2,
              color: rgb(0.45, 0.2, 0.14)
            });
          }

          const quickChangeCheckboxX =
            margin +
            columns[0].width +
            columns[1].width +
            columns[2].width +
            columns[3].width +
            42;
          page.drawRectangle({
            x: quickChangeCheckboxX,
            y: y - 18,
            width: 12,
            height: 12,
            borderColor: rgb(0.45, 0.39, 0.34),
            borderWidth: 1
          });
          if (row.quickChange) {
            page.drawLine({
              start: { x: quickChangeCheckboxX + 2, y: y - 16 },
              end: { x: quickChangeCheckboxX + 10, y: y - 8 },
              thickness: 1.2,
              color: rgb(0.45, 0.2, 0.14)
            });
            page.drawLine({
              start: { x: quickChangeCheckboxX + 10, y: y - 16 },
              end: { x: quickChangeCheckboxX + 2, y: y - 8 },
              thickness: 1.2,
              color: rgb(0.45, 0.2, 0.14)
            });
          }

          const notesStart =
            margin +
            columns[0].width +
            columns[1].width +
            columns[2].width +
            columns[3].width +
            columns[4].width +
            8;
          page.drawLine({
            start: { x: notesStart, y: y - 16 },
            end: { x: margin + tableWidth - 10, y: y - 16 },
            thickness: 0.8,
            color: rgb(0.62, 0.55, 0.48)
          });
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const studioSlug = sanitizeFilename(submitted.studioName) || "recital";

      link.href = url;
      link.download = `${studioSlug}-checklist.pdf`;
      link.click();

      URL.revokeObjectURL(url);
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Recital Admin Tool</p>
          <h1>Generate a clean recital checklist in seconds.</h1>
          <p className="intro">
            Enter your studio details, generate the checklist, and print or save it as a PDF.
          </p>
        </div>

        <form className="generator-card no-print" onSubmit={handleGenerate}>
          <label>
            <span>Studio name</span>
            <input
              type="text"
              value={studioName}
              onChange={(event) => setStudioName(event.target.value)}
              placeholder="Spotlight Dance Studio"
              required
            />
          </label>

          <div className="field-row">
            <label>
              <span>Number of students</span>
              <input
                type="number"
                min="1"
                step="1"
                value={studentCount}
                onChange={(event) => setStudentCount(event.target.value)}
                required
              />
            </label>

            <label>
              <span>Number of routines</span>
              <input
                type="number"
                min="1"
                step="1"
                value={routineCount}
                onChange={(event) => setRoutineCount(event.target.value)}
                required
              />
            </label>
          </div>

          <div className="button-row">
            <button type="submit">Generate</button>
            <button
              type="button"
              className="secondary"
              onClick={handleDownloadPdf}
              disabled={!submitted || isGeneratingPdf}
            >
              {isGeneratingPdf ? "Generating PDF..." : "Save as PDF"}
            </button>
          </div>
        </form>
      </section>

      {submitted ? (
        <section className="checklist-sheet" aria-live="polite">
          <header className="sheet-header">
            <div>
              <p className="sheet-label">Printable Checklist</p>
              <h2>{submitted.studioName}</h2>
            </div>
            <div className="sheet-meta">
              <span>{submitted.studentCount} students</span>
              <span>{submitted.routineCount} routines each</span>
              <span>{checklistRows.length} checklist lines</span>
            </div>
          </header>

          <table className="checklist-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Routine</th>
                <th>Costume</th>
                <th>Paid</th>
                <th>Quick Change</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {checklistRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      className="table-input"
                      type="text"
                      value={row.studentName}
                      onChange={(event) => handleRowFieldChange(row.id, "studentName", event)}
                    />
                  </td>
                  <td>
                    <input
                      className="table-input"
                      type="text"
                      value={row.routine}
                      onChange={(event) => handleRowFieldChange(row.id, "routine", event)}
                    />
                  </td>
                  <td>
                    <input
                      className="table-input"
                      type="text"
                      value={row.costume}
                      onChange={(event) => handleRowFieldChange(row.id, "costume", event)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`checkbox-button${row.paid ? " is-checked" : ""}`}
                      aria-pressed={row.paid}
                      aria-label={`Toggle paid for ${row.studentName} ${row.routine}`}
                      onClick={() => handleRowToggle(row.id, "paid")}
                    >
                      <span className="checkbox" aria-hidden="true" />
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`checkbox-button${row.quickChange ? " is-checked" : ""}`}
                      aria-pressed={row.quickChange}
                      aria-label={`Toggle quick change for ${row.studentName} ${row.routine}`}
                      onClick={() => handleRowToggle(row.id, "quickChange")}
                    >
                      <span className="checkbox" aria-hidden="true" />
                    </button>
                  </td>
                  <td>
                    <span className="notes-line" aria-hidden="true" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="empty-state">
          <p>Your printable checklist will appear here after you generate it.</p>
        </section>
      )}

      <section className="feedback-card no-print">
        <div>
          <p className="sheet-label">Feedback</p>
          <h2>Have an idea for this tool?</h2>
          <p className="feedback-copy">
            Send your suggestion through the feedback form. That gives users a direct way to ask
            for features or improvements.
          </p>
        </div>
        <a
          className="feedback-link"
          href={feedbackFormUrl}
          target="_blank"
          rel="noreferrer"
        >
          Share an Idea
        </a>
      </section>
    </main>
  );
}
