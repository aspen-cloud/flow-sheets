import React, { useEffect, useState } from "react";
import { GraphNode, Table } from "../../../types";
import BaseNode from "../../../components/base-node";
import { BehaviorSubject } from "rxjs";

interface SingleCellNodeIO {
  sources: {
    value: BehaviorSubject<string | number>;
  };
  sinks: {
    output: BehaviorSubject<string>;
  };
}

const SingleCellNode: GraphNode<SingleCellNodeIO> = {
  initializeStreams: function ({ initialData }): SingleCellNodeIO {
    const value = new BehaviorSubject("");
    return {
      sources: {
        value,
      },
      sinks: {
        output: value,
      },
    };
  },

  Component: function ({ data }: { data: SingleCellNodeIO }) {
    const [value, setValue] = useState<any>("Single Value");
    useEffect(() => {
      const subscription = data.sources.value.subscribe(setValue);
      return () => subscription.unsubscribe();
    }, []);
    return (
      <BaseNode sources={data.sources} sinks={data.sinks}>
        <h2 style={{ backgroundColor: "white" }}>{JSON.stringify(value)}</h2>
      </BaseNode>
    );
  },
};

export default SingleCellNode;
