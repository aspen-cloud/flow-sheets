import { array, defaulted, enums, Infer, object, string } from "superstruct";
import { useCallback, useMemo, useState } from "react";
import BaseNode from "../../../base-node";
import { TableStruct } from "../../../structs";

// TODO: what's the best way to converge struct and enum values
enum SortDirection {
  ASC = "ASC",
  DESC = "DESC",
}
const SortDirectionStruct = enums(Object.keys(SortDirection));

const SortDefinitionStruct = object({
  columnAccessor: string(),
  direction: SortDirectionStruct,
});
type SortDefinition = Infer<typeof SortDefinitionStruct>;

function simpleSort(a: any, b: any, direction: SortDirection) {
  if (direction === SortDirection.ASC) return a > b ? 1 : a < b ? -1 : 0;
  return a < b ? 1 : a > b ? -1 : 0;
}

const Sort = {
  inputs: {
    table: defaulted(TableStruct, {}),
  },
  sources: {
    sortDefinitions: defaulted(array(SortDefinitionStruct), []),
  },
  outputs: {
    table: ({ table, sortDefinitions }) => {
      const columns = [...table.columns];
      const rows = [...table.rows].sort((a, b) =>
        sortDefinitions.reduce((current, nextSortDef) => {
          // until we have better typing just supporting string and number compare
          const isNumber = table.rows.every(
            (r) => !isNaN(Number(r[nextSortDef.columnAccessor])),
          );
          if (isNumber) {
            return (
              current ||
              simpleSort(
                Number(a[nextSortDef.columnAccessor]),
                Number(b[nextSortDef.columnAccessor]),
                nextSortDef.direction,
              )
            );
          }
          return (
            current ||
            simpleSort(
              a[nextSortDef.columnAccessor]?.toLowerCase(),
              b[nextSortDef.columnAccessor]?.toLowerCase(),
              nextSortDef.direction,
            )
          );
        }, 0),
      );
      return { columns, rows };
    },
  },
  Component: ({ data }) => {
    const sortDefinitions: SortDefinition[] = useMemo(
      () => data.sources.sortDefinitions.value,
      [data.sources.sortDefinitions],
    );
    const setSortDefinitions = useCallback(
      (newSortDefinitions) => {
        data.sources.sortDefinitions.set(newSortDefinitions);
      },
      [data.sources.sortDefinitions],
    );

    const [
      newSortDefinitionColumnAccessor,
      setNewSortDefinitionColumnAccessor,
    ] = useState<string>();
    const [newSortDefinitionDirection, setNewSortDefinitionDirection] =
      useState<SortDirection>();

    const columnNameMap: Record<string, string> = useMemo(
      () =>
        (data.inputs.table?.columns || []).reduce((currVal, nextVal) => {
          currVal[nextVal.accessor] = nextVal.Header;
          return currVal;
        }, {}),
      [data.inputs.table],
    );

    return (
      <BaseNode sources={data.inputs} sinks={data.outputs}>
        <div
          style={{
            backgroundColor: "white",
            padding: "1em",
          }}
        >
          <div>
            <label>
              Sort by:
              {sortDefinitions.map((sortDef, i) => (
                <div key={i}>
                  {columnNameMap[sortDef.columnAccessor]} -{" "}
                  <select
                    value={sortDef.direction}
                    onChange={(e) => {
                      sortDef.direction = e.target.value as SortDirection;
                      setSortDefinitions(sortDefinitions);
                    }}
                  >
                    {Object.entries(SortDirection).map(([key, val]) => (
                      <option key={key}>{val}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      setSortDefinitions(
                        sortDefinitions.filter((cs) => cs !== sortDef),
                      );
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
              <div>
                <select
                  value={newSortDefinitionColumnAccessor}
                  onChange={(e) => {
                    setNewSortDefinitionColumnAccessor(e.target.value);
                  }}
                >
                  {[
                    <option value={""}> -- select a column -- </option>,
                    ...(data.inputs.table?.columns || [])
                      .filter(
                        (c) =>
                          !sortDefinitions.some(
                            (sd) => c.accessor === sd.columnAccessor,
                          ),
                      )
                      .map((c) => (
                        <option key={c.accessor} value={c.accessor}>
                          {c.Header}
                        </option>
                      )),
                  ]}
                </select>
                <select
                  value={newSortDefinitionDirection}
                  onChange={(e) =>
                    setNewSortDefinitionDirection(SortDirection[e.target.value])
                  }
                >
                  {[
                    <option value={""}> -- select a function -- </option>,
                    ...Object.entries(SortDirection).map(([key, val]) => (
                      <option key={key}>{val}</option>
                    )),
                  ]}
                </select>
                <button
                  onClick={() => {
                    if (
                      !newSortDefinitionColumnAccessor ||
                      !newSortDefinitionDirection
                    )
                      return;
                    if (
                      sortDefinitions.find(
                        (cs) =>
                          cs.columnAccessor ===
                            newSortDefinitionColumnAccessor &&
                          cs.direction === newSortDefinitionDirection,
                      )
                    )
                      return;

                    setSortDefinitions([
                      ...sortDefinitions,
                      {
                        direction: newSortDefinitionDirection,
                        columnAccessor: newSortDefinitionColumnAccessor,
                      },
                    ]);
                  }}
                >
                  Add
                </button>
              </div>
            </label>
          </div>
        </div>
      </BaseNode>
    );
  },
};

export default Sort;
